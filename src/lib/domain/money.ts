export type PriceDifference =
  | { kind: "NONE"; amountPence: 0 }
  | { kind: "COLLECT"; amountPence: number }
  | { kind: "RETURN"; amountPence: number };

export function calculateRescheduleDifference(
  oldPricePence: number,
  newPricePence: number,
): PriceDifference {
  if (oldPricePence < 0 || newPricePence < 0) {
    throw new RangeError("Prices cannot be negative");
  }

  const difference = newPricePence - oldPricePence;
  if (difference === 0) return { kind: "NONE", amountPence: 0 };
  if (difference > 0) return { kind: "COLLECT", amountPence: difference };
  return { kind: "RETURN", amountPence: Math.abs(difference) };
}

export function redeemCredit(balancePence: number, amountDuePence: number) {
  if (balancePence < 0 || amountDuePence < 0) {
    throw new RangeError("Amounts cannot be negative");
  }

  const redeemedPence = Math.min(balancePence, amountDuePence);
  const remainingBalancePence = balancePence - redeemedPence;
  const remainingDuePence = amountDuePence - redeemedPence;

  return {
    redeemedPence,
    remainingBalancePence,
    remainingDuePence,
    status:
      remainingBalancePence === 0 ? "REDEEMED" : "PARTIALLY_REDEEMED",
  } as const;
}
