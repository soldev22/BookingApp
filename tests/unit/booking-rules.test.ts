import { describe, expect, it } from "vitest";
import {
  calculateCutoff,
  formatCancellationCutoff,
  isOnTimeCancellation,
} from "@/lib/domain/cutoff";
import { calculateCustomerCancellation } from "@/lib/domain/cancellation";
import {
  calculateRescheduleDifference,
  redeemCredit,
} from "@/lib/domain/money";
import {
  assertBalancedTransaction,
  ledgerBalance,
  payoutPosition,
} from "@/lib/domain/ledger";
import { scheduleReminders } from "@/lib/domain/reminders";

describe("cancellation cut-off", () => {
  it("treats the exact cut-off boundary as on time", () => {
    const start = new Date("2026-11-11T14:00:00.000Z");
    const cutoff = calculateCutoff(start, 120);
    expect(cutoff.toISOString()).toBe("2026-11-06T14:00:00.000Z");
    expect(isOnTimeCancellation(cutoff, cutoff)).toBe(true);
    expect(
      isOnTimeCancellation(new Date(cutoff.getTime() + 1), cutoff),
    ).toBe(false);
  });

  it("formats GMT and BST cut-offs correctly", () => {
    expect(
      formatCancellationCutoff(
        new Date("2026-10-24T13:00:00.000Z"),
        "Europe/London",
      ),
    ).toContain("14:00");
    expect(
      formatCancellationCutoff(
        new Date("2026-10-26T14:00:00.000Z"),
        "Europe/London",
      ),
    ).toContain("14:00");
  });
});

describe.each(["ONLINE_FULL", "ONLINE_DEPOSIT"] as const)(
  "%s cancellation",
  (paymentMethod) => {
    it("refunds an on-time cancellation with the business absorbing the fee", () => {
      expect(
        calculateCustomerCancellation({
          paymentMethod,
          paidPence: 5000,
          stripeFeePence: 125,
          onTime: true,
          refundFeePolicy: "BUSINESS_ABSORBS",
        }),
      ).toEqual({
        bookingStatus: "CANCELLED_REFUNDED",
        refundPence: 5000,
        creditPence: 0,
        lateCancel: false,
        businessFeePence: 125,
      });
    });

    it("deducts the actual Stripe fee when configured", () => {
      expect(
        calculateCustomerCancellation({
          paymentMethod,
          paidPence: 5000,
          stripeFeePence: 125,
          onTime: true,
          refundFeePolicy: "DEDUCT_FROM_REFUND",
        }).refundPence,
      ).toBe(4875);
    });

    it("issues credit for a late cancellation", () => {
      const result = calculateCustomerCancellation({
        paymentMethod,
        paidPence: 5000,
        stripeFeePence: 125,
        onTime: false,
        refundFeePolicy: "BUSINESS_ABSORBS",
      });
      expect(result.bookingStatus).toBe("CANCELLED_CREDIT");
      expect(result.creditPence).toBe(5000);
    });
  },
);

describe("cash cancellation", () => {
  it("does not create a refund or credit", () => {
    expect(
      calculateCustomerCancellation({
        paymentMethod: "CASH_ON_DAY",
        paidPence: 0,
        stripeFeePence: 0,
        onTime: false,
        refundFeePolicy: "BUSINESS_ABSORBS",
      }),
    ).toMatchObject({
      bookingStatus: "CANCELLED",
      refundPence: 0,
      creditPence: 0,
      lateCancel: true,
    });
  });
});

describe("reschedules and credit", () => {
  it("calculates both higher and lower price differences", () => {
    expect(calculateRescheduleDifference(5000, 6500)).toEqual({
      kind: "COLLECT",
      amountPence: 1500,
    });
    expect(calculateRescheduleDifference(6500, 5000)).toEqual({
      kind: "RETURN",
      amountPence: 1500,
    });
  });

  it("supports partial credit redemption", () => {
    expect(redeemCredit(3000, 5000)).toEqual({
      redeemedPence: 3000,
      remainingBalancePence: 0,
      remainingDuePence: 2000,
      status: "REDEEMED",
    });
    expect(redeemCredit(5000, 3000)).toMatchObject({
      redeemedPence: 3000,
      remainingBalancePence: 2000,
      status: "PARTIALLY_REDEEMED",
    });
  });
});

describe("ledger", () => {
  const lines = [
    {
      direction: "CREDIT" as const,
      amountPence: 10_000,
      availableAt: new Date("2026-10-20"),
    },
    {
      direction: "DEBIT" as const,
      amountPence: 1_000,
      availableAt: new Date("2026-10-20"),
    },
    {
      direction: "CREDIT" as const,
      amountPence: 5_000,
      availableAt: new Date("2026-11-20"),
    },
  ];

  it("calculates live, payable and held balances", () => {
    expect(ledgerBalance(lines)).toBe(14_000);
    expect(payoutPosition(lines, new Date("2026-10-27"))).toEqual({
      payablePence: 9_000,
      heldPence: 5_000,
      balancePence: 14_000,
    });
  });

  it("rejects unbalanced transactions", () => {
    expect(() =>
      assertBalancedTransaction([
        { direction: "DEBIT", amountPence: 100 },
        { direction: "CREDIT", amountPence: 99 },
      ]),
    ).toThrow("Unbalanced ledger transaction");
  });
});

describe("reminders", () => {
  it("skips past reminders, deduplicates offsets and creates stable keys", () => {
    const reminders = scheduleReminders(
      "booking-1",
      new Date("2026-11-10T10:00:00Z"),
      [72, 48, 48, 24],
      new Date("2026-11-08T11:00:00Z"),
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].offsetHours).toBe(24);
    expect(reminders[0].idempotencyKey).toContain("booking:booking-1");
  });
});
