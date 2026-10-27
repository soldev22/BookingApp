import type {
  NotificationChannel,
  NotificationMessage,
  NotificationProvider,
  NotificationReceipt,
} from "./types";

export class NotificationService {
  private readonly providers: Map<NotificationChannel, NotificationProvider>;

  constructor(providers: NotificationProvider[]) {
    this.providers = new Map(
      providers.map((provider) => [provider.channel, provider]),
    );
  }

  async send(
    channel: NotificationChannel,
    message: NotificationMessage,
  ): Promise<NotificationReceipt> {
    const provider = this.providers.get(channel);
    if (!provider) {
      throw new Error(`No notification provider configured for ${channel}`);
    }
    return provider.send(message);
  }
}

export class DevelopmentNotificationProvider
  implements NotificationProvider
{
  constructor(readonly channel: NotificationChannel) {}

  async send(message: NotificationMessage): Promise<NotificationReceipt> {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Development ${this.channel} provider cannot run in production`,
      );
    }
    return {
      providerId: `dev-${message.idempotencyKey}`,
      channel: this.channel,
      acceptedAt: new Date(),
      costPence: 0,
    };
  }
}
