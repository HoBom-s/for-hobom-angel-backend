import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
} from "@nestjs/common";
import { firstValueFrom, of, throwError } from "rxjs";
import { TraceContext } from "src/shared/trace/trace.context";
import { HttpLogInterceptor } from "src/shared/observability/http-log.interceptor";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";

const flush = () => new Promise((r) => setImmediate(r));

const makeCtx = (
  req: Record<string, unknown>,
  statusCode = 200,
): ExecutionContext =>
  ({
    getType: () => "http",
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

const authedReq = (over: Record<string, unknown> = {}) => ({
  method: "POST",
  originalUrl: "/hobom-angel-backend/api/v1/animals",
  hostname: "localhost",
  user: { userId: "user-1", nickname: "hobom" },
  query: {},
  body: { name: "홍길동", phone: "01012345678", note: "hi" },
  headers: { authorization: "Bearer x", "content-type": "application/json" },
  ...over,
});

describe("HttpLogInterceptor", () => {
  let port: jest.Mocked<OutboxPersistencePort>;
  let interceptor: HttpLogInterceptor;

  beforeEach(() => {
    port = {
      save: jest.fn().mockResolvedValue(undefined),
      markAsSent: jest.fn(),
      markAsFailed: jest.fn(),
    };
    interceptor = new HttpLogInterceptor(new TraceContext(), port);
  });

  const handlerOf = (value: unknown): CallHandler =>
    ({ handle: () => of(value) }) as CallHandler;

  it("emits a redacted INFO access-log event on success", async () => {
    await firstValueFrom(
      interceptor.intercept(makeCtx(authedReq()), handlerOf({ ok: true })),
    );
    await flush();

    expect(port.save).toHaveBeenCalledTimes(1);
    const entity = port.save.mock.calls[0][0];
    const payload = entity.payload;
    expect(payload.level).toBe("INFO");
    expect(payload.userId).toBe("user-1");
    expect((payload.meta as any).headers.authorization).toBe("[REDACTED]");
    expect((payload.meta as any).body.phone).toBe("[REDACTED]");
    expect((payload.meta as any).body.name).toBe("[REDACTED]");
    expect((payload.meta as any).body.note).toBe("hi");
  });

  it("skips unauthenticated requests", async () => {
    const req = authedReq({ user: undefined });
    await firstValueFrom(interceptor.intercept(makeCtx(req), handlerOf("x")));
    await flush();
    expect(port.save).not.toHaveBeenCalled();
  });

  it("skips health and auth paths", async () => {
    for (const url of [
      "/",
      "/health/ready",
      "/hobom-angel-backend/api/v1/auth/login",
    ]) {
      await firstValueFrom(
        interceptor.intercept(
          makeCtx(authedReq({ originalUrl: url })),
          handlerOf("x"),
        ),
      );
    }
    await flush();
    expect(port.save).not.toHaveBeenCalled();
  });

  it("emits an ERROR event and rethrows on failure", async () => {
    const failing: CallHandler = {
      handle: () => throwError(() => new BadRequestException("nope")),
    };
    await expect(
      firstValueFrom(interceptor.intercept(makeCtx(authedReq()), failing)),
    ).rejects.toThrow(BadRequestException);
    await flush();

    expect(port.save).toHaveBeenCalledTimes(1);
    const entity = port.save.mock.calls[0][0];
    expect(entity.payload.level).toBe("ERROR");
    expect(entity.payload.statusCode).toBe(400);
  });
});
