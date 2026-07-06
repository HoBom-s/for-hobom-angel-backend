import { PhoneNumber } from "src/hb-backend-api/user/domain/model/vo/phone-number.vo";

describe("PhoneNumber", () => {
  it("normalizes formatted input to digits", () => {
    expect(PhoneNumber.of("010-1234-5678").raw).toBe("01012345678");
    expect(PhoneNumber.of("010 1234 5678").raw).toBe("01012345678");
  });

  it.each(["01012345678", "010-0000-0000"])(
    "accepts valid mobile %s",
    (value) => {
      expect(PhoneNumber.of(value).raw).toMatch(/^010\d{8}$/);
    },
  );

  it.each(["0101234567", "0111234567", "010123456789", "", "abc"])(
    "rejects invalid mobile %s",
    (value) => {
      expect(() => PhoneNumber.of(value)).toThrow();
    },
  );

  it("compares by normalized value", () => {
    expect(
      PhoneNumber.of("010-1234-5678").equals(PhoneNumber.of("01012345678")),
    ).toBe(true);
  });
});
