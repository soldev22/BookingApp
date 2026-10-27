export type NotificationChannel = "EMAIL" | "SMS" | "MESSENGER";

export type NotificationMessage = {
  organisationId: string;
  bookingId?: string;
  recipient: string;
  subject?: string;
  body: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
};

export type NotificationReceipt = {
  providerId: string;
  channel: NotificationChannel;
  acceptedAt: Date;
  costPence?: number;
  segmentCount?: number;
};

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(message: NotificationMessage): Promise<NotificationReceipt>;
}
