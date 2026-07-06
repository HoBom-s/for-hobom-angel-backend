import { Ci } from "src/hb-backend-api/user/domain/model/vo/ci.vo";

describe("Ci", () => {
  it("accepts a non-empty value and trims", () => {
    expect(Ci.of("  abc123==  ").raw).toBe("abc123==");
  });

  it.each(["", "   "])("rejects empty value %s", (value) => {
    expect(() => Ci.of(value)).toThrow();
  });

  it("compares by value", () => {
    expect(Ci.of("same").equals(Ci.of("same"))).toBe(true);
    expect(Ci.of("a").equals(Ci.of("b"))).toBe(false);
  });
});
