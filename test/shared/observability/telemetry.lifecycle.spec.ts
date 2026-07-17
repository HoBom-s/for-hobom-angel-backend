import { TelemetryLifecycle } from "src/shared/observability/telemetry.lifecycle";
import * as tracing from "src/tracing";

describe("TelemetryLifecycle", () => {
  const lifecycle = new TelemetryLifecycle();

  afterEach(() => jest.restoreAllMocks());

  it("flushes telemetry on application shutdown", async () => {
    const shutdown = jest
      .spyOn(tracing, "shutdownTelemetry")
      .mockResolvedValue(undefined);

    await lifecycle.onApplicationShutdown();

    expect(shutdown).toHaveBeenCalledTimes(1);
  });

  it("swallows a flush failure so shutdown never crashes", async () => {
    jest
      .spyOn(tracing, "shutdownTelemetry")
      .mockRejectedValue(new Error("collector unreachable"));

    await expect(lifecycle.onApplicationShutdown()).resolves.toBeUndefined();
  });
});
