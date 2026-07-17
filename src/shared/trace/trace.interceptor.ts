import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { trace } from "@opentelemetry/api";
import { randomUUID } from "crypto";
import { Request } from "express";
import { Observable } from "rxjs";
import { TraceContext } from "src/shared/trace/trace.context";

const TRACE_HEADER = "x-hobom-trace-id";

/**
 * Reads (or mints) a trace id per HTTP request and binds it to {@link TraceContext}
 * for the duration of the handler. Only HTTP is handled here; gRPC/job contexts
 * pass through untouched.
 *
 * The `x-hobom-trace-id` (which the outbox → `hobom.logs` pipeline carries) is
 * also stamped onto the active OpenTelemetry span as `hobom.trace_id`, so the
 * two correlation ids coexist: OTel keeps its own W3C trace context while our
 * logs and the log pipeline stay joinable to traces. A no-op when OTel is
 * dormant (no active span).
 */
@Injectable()
export class TraceInterceptor implements NestInterceptor {
  constructor(private readonly traceContext: TraceContext) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers[TRACE_HEADER];
    const traceId =
      (Array.isArray(header) ? header[0] : header) ?? randomUUID();
    trace.getActiveSpan()?.setAttribute("hobom.trace_id", traceId);
    return this.traceContext.run(traceId, () => next.handle());
  }
}
