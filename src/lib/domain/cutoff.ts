import { subHours } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function calculateCutoff(appointmentStartsAt: Date, cutoffHours: number) {
  if (!Number.isInteger(cutoffHours) || cutoffHours < 0) {
    throw new RangeError("cutoffHours must be a non-negative integer");
  }

  return subHours(appointmentStartsAt, cutoffHours);
}

export function isOnTimeCancellation(cancelledAt: Date, cutoffAt: Date) {
  return cancelledAt.getTime() <= cutoffAt.getTime();
}

export function formatCancellationCutoff(
  cutoffAt: Date,
  timezone = "Europe/London",
) {
  return formatInTimeZone(cutoffAt, timezone, "HH:mm EEE d MMM");
}
