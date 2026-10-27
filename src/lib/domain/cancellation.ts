export type PaymentTiming = "ONLINE_FULL" | "ONLINE_DEPOSIT" | "CASH_ON_DAY";
export type RefundFeePolicy = "BUSINESS_ABSORBS" | "DEDUCT_FROM_REFUND";

export type CancellationOutcome = {
  bookingStatus: "CANCELLED" | "CANCELLED_REFUNDED" | "CANCELLED_CREDIT";
  refundPence: number;
  creditPence: number;
  lateCancel: boolean;
  businessFeePence: number;
};

type CancellationInput = {
  paymentMethod: PaymentTiming;
  paidPence: number;
  stripeFeePence: number;
  onTime: boolean;
  refundFeePolicy: RefundFeePolicy;
};

export function calculateCustomerCancellation({
  paymentMethod,
  paidPence,
  stripeFeePence,
  onTime,
  refundFeePolicy,
}: CancellationInput): CancellationOutcome {
  if (paidPence < 0 || stripeFeePence < 0) {
    throw new RangeError("Payment amounts cannot be negative");
  }

  if (paymentMethod === "CASH_ON_DAY") {
    return {
      bookingStatus: "CANCELLED",
      refundPence: 0,
      creditPence: 0,
      lateCancel: !onTime,
      businessFeePence: 0,
    };
  }

  if (!onTime) {
    return {
      bookingStatus: "CANCELLED_CREDIT",
      refundPence: 0,
      creditPence: paidPence,
      lateCancel: true,
      businessFeePence: 0,
    };
  }

  const deductedFee =
    refundFeePolicy === "DEDUCT_FROM_REFUND"
      ? Math.min(stripeFeePence, paidPence)
      : 0;

  return {
    bookingStatus: "CANCELLED_REFUNDED",
    refundPence: paidPence - deductedFee,
    creditPence: 0,
    lateCancel: false,
    businessFeePence:
      refundFeePolicy === "BUSINESS_ABSORBS" ? stripeFeePence : 0,
  };
}
