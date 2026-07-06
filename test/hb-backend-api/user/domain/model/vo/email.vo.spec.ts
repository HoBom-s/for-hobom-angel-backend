import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";

describe("Email", () => {
  it("normalizes to lowercase and trims", () => {
    expect(Email.of("  Foo@Bar.COM ").raw).toBe("foo@bar.com");
  });

  it.each(["a@b.co", "user.name+tag@sub.domain.io"])(
    "accepts valid email %s",
    (value) => {
      expect(Email.of(value).raw).toBe(value.toLowerCase());
    },
  );

  it.each(["", "no-at", "a@b", "a b@c.com", "@b.com", "a@.com"])(
    "rejects invalid email %s",
    (value) => {
      expect(() => Email.of(value)).toThrow();
    },
  );

  it("compares by value", () => {
    expect(Email.of("A@b.com").equals(Email.of("a@b.com"))).toBe(true);
  });
});
