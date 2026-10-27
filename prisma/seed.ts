import {
  BookingPaymentMethod,
  BookingStatus,
  MessageChannel,
  PaymentStatus,
  PrismaClient,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { addHours, subHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@salonflow.local" },
    update: {},
    create: {
      name: "Olivia Martin",
      email: "owner@salonflow.local",
      passwordHash: await hash("SalonFlow123!", 12),
    },
  });

  const organisation = await prisma.organisation.upsert({
    where: { slug: "rose-and-honey" },
    update: {},
    create: {
      name: "Rose & Honey",
      slug: "rose-and-honey",
      status: "ACTIVE",
      brandColour: "#6d3b72",
      onboardingCompletedAt: new Date(),
      memberships: {
        create: { userId: owner.id, role: "OWNER" },
      },
      settings: {
        create: {
          enabledPaymentMethods: [
            "ONLINE_FULL",
            "ONLINE_DEPOSIT",
            "CASH_ON_DAY",
          ],
          reminderOffsetsHours: [72, 48, 24],
          termsText: "Demo booking terms for Rose & Honey.",
          cancellationPolicyText:
            "Free cancellation is available until 120 hours before the appointment.",
        },
      },
    },
  });

  const customer = await prisma.customer.upsert({
    where: {
      id: "demo-customer-sophie",
    },
    update: {},
    create: {
      id: "demo-customer-sophie",
      organisationId: organisation.id,
      name: "Sophie Miller",
      email: "sophie@example.com",
      phone: "+447700900123",
    },
  });

  const service = await prisma.service.upsert({
    where: { id: "demo-service-cut" },
    update: {},
    create: {
      id: "demo-service-cut",
      organisationId: organisation.id,
      name: "Cut & blow dry",
      durationMinutes: 60,
      bufferMinutes: 15,
      pricePence: 4800,
    },
  });

  const statuses: BookingStatus[] = [
    "PENDING_PAYMENT",
    "CONFIRMED",
    "COMPLETED",
    "NO_SHOW",
    "CANCELLED",
    "CANCELLED_REFUNDED",
    "CANCELLED_CREDIT",
    "CANCELLED_BY_BUSINESS",
    "EXPIRED",
  ];
  const start = addHours(new Date(), 24);
  for (const [index, status] of statuses.entries()) {
    const startsAt = addHours(start, index * 2);
    await prisma.booking.upsert({
      where: {
        organisationId_reference: {
          organisationId: organisation.id,
          reference: `DEMO-${index + 1}`,
        },
      },
      update: {},
      create: {
        organisationId: organisation.id,
        customerId: customer.id,
        serviceId: service.id,
        reference: `DEMO-${index + 1}`,
        status,
        paymentMethod:
          index % 3 === 0
            ? BookingPaymentMethod.ONLINE_FULL
            : index % 3 === 1
              ? BookingPaymentMethod.ONLINE_DEPOSIT
              : BookingPaymentMethod.CASH_ON_DAY,
        paymentStatus:
          status === "COMPLETED" ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        startsAt,
        endsAt: addHours(startsAt, 1),
        cutoffAt: subHours(startsAt, 120),
        pricePence: 4800,
        amountDuePence: status === "COMPLETED" ? 0 : 4800,
        amountPaidPence: status === "COMPLETED" ? 4800 : 0,
        preferredChannels: [MessageChannel.EMAIL, MessageChannel.SMS],
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
