import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Metadata } from "@grpc/grpc-js";
import { timingSafeEqual } from "crypto";

/**
 * Authenticates gRPC calls against a shared secret. The outbox relay
 * (hobom-event-processor) sends it as the `x-api-key` metadata header; the
 * expected value is `HOBOM_GRPC_API_KEY`. Fail-closed: a missing/mismatched key
 * is rejected, and if the secret is unconfigured `getOrThrow` throws rather than
 * letting an unauthenticated caller drain or mutate the outbox.
 */
@Injectable()
export class GrpcApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  public canActivate(context: ExecutionContext): boolean {
    const metadata = context.switchToRpc().getContext<Metadata>();
    const apiKey = metadata.get("x-api-key")[0] as string | undefined;
    const expected =
      this.configService.getOrThrow<string>("HOBOM_GRPC_API_KEY");

    if (
      apiKey?.length !== expected.length ||
      !timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected))
    ) {
      throw new UnauthorizedException("Invalid gRPC API key");
    }

    return true;
  }
}
