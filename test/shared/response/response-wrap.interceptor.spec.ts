import { CallHandler, ExecutionContext } from "@nestjs/common";
import { firstValueFrom, of } from "rxjs";
import { ResponseEntity } from "src/shared/response/response.entity";
import { ResponseWrapInterceptor } from "src/shared/response/response-wrap.interceptor";

const ctx = {} as ExecutionContext;
const handlerOf = (value: unknown): CallHandler =>
  ({ handle: () => of(value) }) as CallHandler;

describe("ResponseWrapInterceptor", () => {
  const interceptor = new ResponseWrapInterceptor();

  it("wraps a raw value in a ResponseEntity", async () => {
    const out = await firstValueFrom(
      interceptor.intercept(ctx, handlerOf({ a: 1 })),
    );
    expect(out).toBeInstanceOf(ResponseEntity);
    expect((out as ResponseEntity<unknown>).items).toEqual({ a: 1 });
  });

  it("passes an existing ResponseEntity through untouched", async () => {
    const existing = ResponseEntity.ok("x");
    const out = await firstValueFrom(
      interceptor.intercept(ctx, handlerOf(existing)),
    );
    expect(out).toBe(existing);
  });
});
