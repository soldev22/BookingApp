export type LedgerLine = {
  direction: "DEBIT" | "CREDIT";
  amountPence: number;
  availableAt?: Date | null;
};

export function signedAmount(line: LedgerLine) {
  return line.direction === "CREDIT" ? line.amountPence : -line.amountPence;
}

export function ledgerBalance(lines: LedgerLine[]) {
  return lines.reduce((total, line) => total + signedAmount(line), 0);
}

export function payoutPosition(lines: LedgerLine[], asOf: Date) {
  let payablePence = 0;
  let heldPence = 0;

  for (const line of lines) {
    const amount = signedAmount(line);
    if (!line.availableAt || line.availableAt <= asOf) {
      payablePence += amount;
    } else {
      heldPence += amount;
    }
  }

  return { payablePence, heldPence, balancePence: payablePence + heldPence };
}

export function assertBalancedTransaction(lines: LedgerLine[]) {
  const debits = lines
    .filter((line) => line.direction === "DEBIT")
    .reduce((sum, line) => sum + line.amountPence, 0);
  const credits = lines
    .filter((line) => line.direction === "CREDIT")
    .reduce((sum, line) => sum + line.amountPence, 0);

  if (debits !== credits) {
    throw new Error(`Unbalanced ledger transaction: ${debits} != ${credits}`);
  }
}
