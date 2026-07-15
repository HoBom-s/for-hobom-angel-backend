import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Metadata } from "@grpc/grpc-js";
import { GrpcApiKeyGuard } from "src/infra/grpc/grpc-api-key.guard";

const EXPECTED = "super-secret-key";

const contextWith = (apiKey?: string): ExecutionContext => {
  const metadata = new Metadata();
  if (apiKey !== undefined) {
    metadata.set("x-api-key", apiKey);
  }
  return {
    switchToRpc: () => ({ getContext: () => metadata }),
  } as unknown as ExecutionContext;
};

describe("GrpcApiKeyGuard", () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue(EXPECTED),
  } as unknown as ConfigService;
  const guard = new GrpcApiKeyGuard(config);

  it("allows a call carrying the correct x-api-key", () => {
    expect(guard.canActivate(contextWith(EXPECTED))).toBe(true);
  });

  it("rejects a wrong key", () => {
    expect(() => guard.canActivate(contextWith("nope"))).toThrow(
      UnauthorizedException,
    );
  });

  it("rejects a missing key", () => {
    expect(() => guard.canActivate(contextWith())).toThrow(
      UnauthorizedException,
    );
  });
});
