import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable, catchError, tap, throwError } from "rxjs";
import { DIToken } from "src/shared/di/token.di";
import { TraceContext } from "src/shared/trace/trace.context";
import { redactHeaders, redactPii } from "src/shared/observability/redact";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxPayloadFactoryRegistry } from "src/hb-backend-api/outbox/domain/model/outbox-payload-factory.registry";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";

/**
 * Ships a best-effort HTTP access log through the outbox (HOBOM_LOG) for
 * downstream analytics — mirroring the sister service's pattern, with two
 * deliberate differences:
 *  - request context (query/body/headers) is REDACTED so PII/secrets never enter
 *    the log pipeline (this is a privacy-sensitive platform);
 *  - the actor id comes straight off the verified JWT (`req.user.userId`), so no
 *    extra per-request DB lookup is needed.
 *
 * Fire-and-forget: a logging failure never affects the request. This is the
 * best-effort tier; the compliance audit trail is separate and transactional.
 */
@Injectable()
export class HttpLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLogInterceptor.name);

  constructor(
    private readonly traceContext: TraceContext,
    @Inject(DIToken.OutboxModule.OutboxPersistencePort)
    private readonly outboxPersistencePort: OutboxPersistencePort,
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request>();
    // Express.User is an empty interface; the JWT strategy populates userId.
    const user = req.user;
    if (this.shouldSkip(req) || !user?.userId) {
      return next.handle();
    }
    const userId = user.userId;
    const res = context.switchToHttp().getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      tap(() => this.emit("INFO", req, res.statusCode, userId)),
      catchError((err: unknown) => {
        const status = err instanceof HttpException ? err.getStatus() : 500;
        this.emit("ERROR", req, status, userId, err);
        return throwError(() => err);
      }),
    );
  }

  private shouldSkip(req: Request): boolean {
    const url = req.originalUrl || req.url || "";
    return (
      url === "/" ||
      url.startsWith("/health") ||
      url.startsWith("/metrics") ||
      url.includes("/auth") ||
      url.includes("/internal")
    );
  }

  private emit(
    level: "INFO" | "ERROR",
    req: Request,
    statusCode: number,
    userId: string,
    err?: unknown,
  ): void {
    const path = req.originalUrl || req.url || "";
    const payload = OutboxPayloadFactoryRegistry[EventType.HOBOM_LOG]({
      traceId: this.traceContext.getTraceId() ?? null,
      level,
      method: req.method,
      path,
      statusCode,
      host: req.hostname,
      userId,
      message: `[${req.method}] ${path}${err ? " - ERROR" : ""}`,
      meta: {
        query: redactPii(req.query),
        body: redactPii(
          typeof req.body === "object" ? (req.body as unknown) : {},
        ),
        headers: redactHeaders(req.headers),
        ...(err ? { error: toMessage(err) } : {}),
      },
    });

    void this.outboxPersistencePort
      .save(CreateOutboxEntity.of(EventType.HOBOM_LOG, payload))
      .catch((e: unknown) =>
        this.logger.warn(`Failed to save access log: ${toMessage(e)}`),
      );
  }
}

function toMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return typeof e === "string" ? e : "unknown error";
}
