import { Global, Module } from "@nestjs/common";
import { DiscordWebhookService } from "src/shared/discord/discord-webhook.service";

@Global()
@Module({
  providers: [DiscordWebhookService],
  exports: [DiscordWebhookService],
})
export class DiscordModule {}
