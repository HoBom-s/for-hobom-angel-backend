describe("tracing", () => {
  const ORIGINAL = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    } else {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = ORIGINAL;
    }
    jest.resetModules();
    jest.dontMock("@opentelemetry/sdk-node");
  });

  it("stays dormant (fail-open) when no OTLP endpoint is configured", async () => {
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    jest.resetModules();

    const mod = await import("src/tracing");

    expect(mod.telemetryEnabled()).toBe(false);
    await expect(mod.shutdownTelemetry()).resolves.toBeUndefined();
  });

  it("starts the SDK and flushes on shutdown when an endpoint is set", async () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4318";
    const start = jest.fn();
    const shutdown = jest.fn().mockResolvedValue(undefined);
    jest.resetModules();
    jest.doMock("@opentelemetry/sdk-node", () => ({
      NodeSDK: jest.fn().mockImplementation(() => ({ start, shutdown })),
    }));

    const mod = await import("src/tracing");

    expect(start).toHaveBeenCalledTimes(1);
    expect(mod.telemetryEnabled()).toBe(true);

    await mod.shutdownTelemetry();
    expect(shutdown).toHaveBeenCalledTimes(1);
    // Idempotent: a second signal must not double-shutdown.
    expect(mod.telemetryEnabled()).toBe(false);
    await mod.shutdownTelemetry();
    expect(shutdown).toHaveBeenCalledTimes(1);
  });

  it("degrades to dormant if the SDK throws on start", async () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4318";
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.resetModules();
    jest.doMock("@opentelemetry/sdk-node", () => ({
      NodeSDK: jest.fn().mockImplementation(() => {
        throw new Error("boom");
      }),
    }));

    const mod = await import("src/tracing");

    expect(mod.telemetryEnabled()).toBe(false);
  });
});
