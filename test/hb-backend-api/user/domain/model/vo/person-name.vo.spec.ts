import { PersonName } from "src/hb-backend-api/user/domain/model/vo/person-name.vo";

describe("PersonName", () => {
  it("accepts a valid name and trims", () => {
    expect(PersonName.of("  홍길동 ").raw).toBe("홍길동");
  });

  it.each(["", "   ", "a".repeat(51)])("rejects invalid name %s", (value) => {
    expect(() => PersonName.of(value)).toThrow();
  });
});
