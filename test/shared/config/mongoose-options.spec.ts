import { ConfigService } from "@nestjs/config";
import { buildMongooseOptions } from "src/shared/config/mongoose-options";

const cfg = (env: Record<string, string>): ConfigService =>
  ({
    get: (k: string) => env[k],
    getOrThrow: (k: string) => env[k],
  }) as unknown as ConfigService;

describe("buildMongooseOptions", () => {
  const uri = "mongodb://localhost/db";

  it("enables autoIndex outside production", () => {
    expect(
      buildMongooseOptions(
        cfg({
          NODE_ENV: "development",
          HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB: uri,
        }),
      ).autoIndex,
    ).toBe(true);
    expect(
      buildMongooseOptions(
        cfg({ NODE_ENV: "test", HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB: uri }),
      ).autoIndex,
    ).toBe(true);
  });

  it("disables autoIndex in production", () => {
    expect(
      buildMongooseOptions(
        cfg({
          NODE_ENV: "production",
          HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB: uri,
        }),
      ).autoIndex,
    ).toBe(false);
  });

  it("passes the configured uri through", () => {
    expect(
      buildMongooseOptions(
        cfg({ HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB: "the-uri" }),
      ).uri,
    ).toBe("the-uri");
  });
});
