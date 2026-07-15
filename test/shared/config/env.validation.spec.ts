import { validate } from "src/shared/config/env.validation";

const validEnv = () => ({
  NODE_ENV: "development",
  HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB: "mongodb://localhost/db",
  HOBOM_JWT_SECRET: "access",
  HOBOM_JWT_REFRESH_SECRET: "refresh",
  HOBOM_JWT_ACCESS_TOKEN_EXPIRED: "15m",
  HOBOM_JWT_REFRESH_TOKEN_EXPIRED: "30d",
});

describe("env validation", () => {
  it("passes and returns the original config (extra vars preserved)", () => {
    const env = { ...validEnv(), KAFKA_BROKERS: "kafka:9092" };
    const out = validate(env);
    expect(out).toBe(env);
    expect(out.KAFKA_BROKERS).toBe("kafka:9092");
  });

  it.each([
    "HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB",
    "HOBOM_JWT_SECRET",
    "HOBOM_JWT_REFRESH_SECRET",
    "HOBOM_JWT_ACCESS_TOKEN_EXPIRED",
    "HOBOM_JWT_REFRESH_TOKEN_EXPIRED",
  ])("throws when required var %s is missing", (key) => {
    const env = validEnv() as Record<string, unknown>;
    delete env[key];
    expect(() => validate(env)).toThrow(/Invalid environment/);
  });

  it("throws on a blank required var", () => {
    expect(() => validate({ ...validEnv(), HOBOM_JWT_SECRET: "" })).toThrow();
  });

  it("throws on an unknown NODE_ENV", () => {
    expect(() => validate({ ...validEnv(), NODE_ENV: "staging" })).toThrow();
  });

  it("requires FIELD_ENCRYPTION_KEY in production", () => {
    const prod = {
      ...validEnv(),
      NODE_ENV: "production",
      HOBOM_GRPC_API_KEY: "grpc-key",
    };
    expect(() => validate(prod)).toThrow(/FIELD_ENCRYPTION_KEY/);
    expect(() =>
      validate({ ...prod, FIELD_ENCRYPTION_KEY: "key" }),
    ).not.toThrow();
  });

  it("requires HOBOM_GRPC_API_KEY in production", () => {
    const prod = {
      ...validEnv(),
      NODE_ENV: "production",
      FIELD_ENCRYPTION_KEY: "key",
    };
    expect(() => validate(prod)).toThrow(/HOBOM_GRPC_API_KEY/);
    expect(() =>
      validate({ ...prod, HOBOM_GRPC_API_KEY: "grpc-key" }),
    ).not.toThrow();
  });

  it("allows a missing FIELD_ENCRYPTION_KEY outside production", () => {
    expect(() => validate(validEnv())).not.toThrow();
  });
});
