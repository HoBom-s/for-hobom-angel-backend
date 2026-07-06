import { CallHandler, ExecutionContext } from "@nestjs/common";
import { firstValueFrom, of } from "rxjs";
import { TraceContext } from "src/shared/trace/trace.context";
import { TraceInterceptor } from "src/shared/trace/trace.interceptor";

describe("TraceInterceptor", () => {
  const traceContext = new TraceContext();
  const interceptor = new TraceInterceptor(traceContext);

  const httpCtx = (headers: Record<string, unknown>): ExecutionContext =>
    ({
      getType: () => "http",
      switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    }) as unknown as ExecutionContext;

  it("binds the provided trace id during handling", async () => {
    let seen: string | undefined;
    const next: CallHandler = {
      handle: () => {
        seen = traceContext.getTraceId();
        return of("ok");
      },
    };
    await firstValueFrom(
      interceptor.intercept(httpCtx({ "x-hobom-trace-id": "abc" }), next),
    );
    expect(seen).toBe("abc");
  });

  it("generates a trace id when the header is absent", async () => {
    let seen: string | undefined;
    const next: CallHandler = {
      handle: () => {
        seen = traceContext.getTraceId();
        return of("ok");
      },
    };
    await firstValueFrom(interceptor.intercept(httpCtx({}), next));
    expect(seen).toBeDefined();
  });

  it("passes non-http contexts through untouched", async () => {
    const rpcCtx = { getType: () => "rpc" } as unknown as ExecutionContext;
    const out = await firstValueFrom(
      interceptor.intercept(rpcCtx, { handle: () => of("v") } as CallHandler),
    );
    expect(out).toBe("v");
  });
});
