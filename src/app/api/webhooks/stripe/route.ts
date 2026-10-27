import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/server/db";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(secret);
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const existing = await db.webhookEvent.findUnique({
    where: {
      provider_externalId: { provider: "stripe", externalId: event.id },
    },
  });
  if (existing?.processedAt) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await db.webhookEvent.upsert({
    where: {
      provider_externalId: { provider: "stripe", externalId: event.id },
    },
    create: {
      provider: "stripe",
      externalId: event.id,
      type: event.type,
      payload: JSON.parse(body),
    },
    update: {},
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      const organisationId = session.metadata?.organisationId;
      if (!bookingId || !organisationId) {
        throw new Error("Stripe session is missing booking metadata");
      }

      await db.$transaction(async (transaction) => {
        const booking = await transaction.booking.findFirstOrThrow({
          where: { id: bookingId, organisationId },
        });
        const paidPence = session.amount_total ?? booking.amountDuePence;
        await transaction.payment.upsert({
          where: { stripeCheckoutSessionId: session.id },
          create: {
            organisationId,
            bookingId,
            method: "STRIPE",
            status: "SUCCEEDED",
            amountPence: paidPence,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            receivedAt: new Date(),
          },
          update: { status: "SUCCEEDED", receivedAt: new Date() },
        });
        await transaction.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus:
              booking.paymentMethod === "ONLINE_DEPOSIT"
                ? "DEPOSIT_PAID"
                : "PAID",
            amountPaidPence: paidPence,
          },
        });
      });
    }

    await db.webhookEvent.update({
      where: {
        provider_externalId: { provider: "stripe", externalId: event.id },
      },
      data: { processedAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.webhookEvent.update({
      where: {
        provider_externalId: { provider: "stripe", externalId: event.id },
      },
      data: { error: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
