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
import {
  DomainErrorKind,
  DomainException,
} from "src/shared/exception/domain-exception";

interface ErrorBody {
  statusCode: number;
  path: string;
  message: string;
  timestamp: string;
}

const DOMAIN_KIND_STATUS: Record<DomainErrorKind, HttpStatus> = {
  [DomainErrorKind.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorKind.CONFLICT]: HttpStatus.CONFLICT,
  [DomainErrorKind.INVALID_INPUT]: HttpStatus.BAD_REQUEST,
};

/** Shown to clients on a 5xx — never the raw error, which may leak internals. */
const MASKED_5XX_MESSAGE =
  "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";

/**
 * Single place that shapes error responses. It maps {@link HttpException} and
 * framework-agnostic {@link DomainException}s to the right status + client
 * message, and masks every other error (real bugs, infra failures) as a generic
 * 500 so internal details never reach the client. 5xx errors are logged in full
 * server-side and forwarded to Discord (best-effort) when a webhook is set.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly discord: DiscordWebhookService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    if (status >= 500) {
      // Log the REAL error server-side; the client only sees the masked message.
      const detail =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      void this.discord.notifyError(
        `[${request.method} ${request.url}] ${status} ${detail}`,
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

  private resolve(exception: unknown): { status: number; message: string } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: this.httpMessage(exception),
      };
    }
    if (exception instanceof DomainException) {
      return {
        status: DOMAIN_KIND_STATUS[exception.kind],
        message: exception.message,
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: MASKED_5XX_MESSAGE,
    };
  }

  private httpMessage(exception: HttpException): string {
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
}
