import { TraceContext } from "src/shared/trace/trace.context";

describe("TraceContext", () => {
  it("exposes the trace id only within the run scope", () => {
    const ctx = new TraceContext();
    expect(ctx.getTraceId()).toBeUndefined();
    const seen = ctx.run("trace-1", () => ctx.getTraceId());
    expect(seen).toBe("trace-1");
    expect(ctx.getTraceId()).toBeUndefined();
  });
});
