import { redactHeaders, redactPii } from "src/shared/observability/redact";

describe("redactHeaders", () => {
  it("redacts auth/cookie/api-key headers, keeps the rest", () => {
    const out = redactHeaders({
      authorization: "Bearer secret",
      cookie: "accessToken=abc",
      "x-hobom-api-key": "k",
      "content-type": "application/json",
      "x-hobom-trace-id": "trace-1",
    });
    expect(out.authorization).toBe("[REDACTED]");
    expect(out.cookie).toBe("[REDACTED]");
    expect(out["x-hobom-api-key"]).toBe("[REDACTED]");
    expect(out["content-type"]).toBe("application/json");
    expect(out["x-hobom-trace-id"]).toBe("trace-1");
  });

  it("handles undefined headers", () => {
    expect(redactHeaders(undefined)).toEqual({});
  });
});

describe("redactPii", () => {
  it("redacts PII/secret keys anywhere in the tree", () => {
    const out = redactPii({
      nickname: "hobom",
      phone: "01012345678",
      profile: { realName: "홍길동", note: "ok" },
      tokens: [{ accessToken: "a" }],
    }) as Record<string, unknown>;

    expect(out.nickname).toBe("hobom");
    expect(out.phone).toBe("[REDACTED]");
    expect((out.profile as Record<string, unknown>).realName).toBe(
      "[REDACTED]",
    );
    expect((out.profile as Record<string, unknown>).note).toBe("ok");
    expect((out.tokens as Record<string, unknown>[])[0].accessToken).toBe(
      "[REDACTED]",
    );
  });

  it("is case-insensitive on keys", () => {
    const out = redactPii({ Email: "a@b.com", PASSWORD: "x" }) as Record<
      string,
      unknown
    >;
    expect(out.Email).toBe("[REDACTED]");
    expect(out.PASSWORD).toBe("[REDACTED]");
  });

  it("passes primitives and null through", () => {
    expect(redactPii(null)).toBeNull();
    expect(redactPii("plain")).toBe("plain");
    expect(redactPii(42)).toBe(42);
  });

  it("stops recursing past the depth bound", () => {
    let deep: Record<string, unknown> = { phone: "x" };
    for (let i = 0; i < 8; i++) {
      deep = { nested: deep };
    }
    // should not throw
    expect(() => redactPii(deep)).not.toThrow();
  });
});
