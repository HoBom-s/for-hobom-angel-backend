import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { DiscordWebhookService } from "src/shared/discord/discord-webhook.service";

interface ErrorBody {
  statusCode: number;
  path: string;
  message: string;
  timestamp: string;
}

/**
 * Single place that shapes error responses. 5xx errors are additionally
 * forwarded to Discord (best-effort) when a webhook is configured.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly discord: DiscordWebhookService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.resolveMessage(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      void this.discord.notifyError(
        `[${request.method} ${request.url}] ${status} ${message}`,
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      path: request.url,
      message,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === "string") {
        return res;
      }
      const maybe = (res as { message?: string | string[] }).message;
      if (Array.isArray(maybe)) {
        return maybe.join(", ");
      }
      return maybe ?? exception.message;
    }
    return exception instanceof Error
      ? exception.message
      : "Internal server error";
  }
}
