import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";

describe("Nickname", () => {
  it.each(["hobom", "호봄이", "user_01", "a-b", "가나다라"])(
    "accepts valid nickname %s",
    (value) => {
      expect(Nickname.of(value).raw).toBe(value);
    },
  );

  it("trims surrounding whitespace", () => {
    expect(Nickname.of("  hobom  ").raw).toBe("hobom");
  });

  it.each([
    "a",
    "",
    "   ",
    "way-too-long-nickname-value",
    "bad!char",
    "sp ace",
  ])("rejects invalid nickname %s", (value) => {
    expect(() => Nickname.of(value)).toThrow();
  });

  it("compares by value", () => {
    expect(Nickname.of("hobom").equals(Nickname.of("hobom"))).toBe(true);
    expect(Nickname.of("hobom").equals(Nickname.of("angel"))).toBe(false);
  });
});
