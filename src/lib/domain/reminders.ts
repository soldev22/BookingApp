import { subHours } from "date-fns";

export type Reminder = {
  offsetHours: number;
  sendAt: Date;
  idempotencyKey: string;
};

export function scheduleReminders(
  bookingId: string,
  startsAt: Date,
  offsetsHours: number[],
  now = new Date(),
): Reminder[] {
  return [...new Set(offsetsHours)]
    .filter((offset) => Number.isInteger(offset) && offset >= 0)
    .map((offsetHours) => ({
      offsetHours,
      sendAt: subHours(startsAt, offsetHours),
      idempotencyKey: `booking:${bookingId}:reminder:${offsetHours}:${startsAt.toISOString()}`,
    }))
    .filter((reminder) => reminder.sendAt > now)
    .sort((a, b) => a.sendAt.getTime() - b.sendAt.getTime());
}
