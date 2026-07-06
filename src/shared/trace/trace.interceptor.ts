import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { Request } from "express";
import { Observable } from "rxjs";
import { TraceContext } from "src/shared/trace/trace.context";

const TRACE_HEADER = "x-hobom-trace-id";

/**
 * Reads (or mints) a trace id per HTTP request and binds it to {@link TraceContext}
 * for the duration of the handler. Only HTTP is handled here; gRPC/job contexts
 * pass through untouched.
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
    return this.traceContext.run(traceId, () => next.handle());
  }
}
