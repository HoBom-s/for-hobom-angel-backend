import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Best-effort Discord alerting for 5xx errors. No-op when the webhook URL is
 * unset. Never throws — alerting failure must not mask the original error.
 */
@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);
  private readonly webhookUrl: string | undefined;

  constructor(config: ConfigService) {
    this.webhookUrl =
      config.get<string>("HOBOM_DISCORD_WEBHOOK_URL") || undefined;
  }

  public async notifyError(content: string): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: content.slice(0, 1900) }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
    } catch (error) {
      this.logger.warn(
        `Discord webhook failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
