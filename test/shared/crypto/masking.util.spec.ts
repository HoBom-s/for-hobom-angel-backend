import { maskEmail, maskName, maskPhone } from "src/shared/crypto/masking.util";

describe("masking", () => {
  describe("maskName", () => {
    it.each([
      ["김", "김"],
      ["홍길", "홍*"],
      ["홍길동", "홍*동"],
      ["남궁민수", "남**수"],
    ])("masks %s -> %s", (input, expected) => {
      expect(maskName(input)).toBe(expected);
    });
  });

  describe("maskPhone", () => {
    it("keeps first 3 and last 4 digits", () => {
      expect(maskPhone("01012345678")).toBe("010-****-5678");
      expect(maskPhone("010-1234-5678")).toBe("010-****-5678");
    });
  });

  describe("maskEmail", () => {
    it("masks the local part, keeps the domain", () => {
      expect(maskEmail("hobom@example.com")).toBe("ho***@example.com");
      expect(maskEmail("a@b.com")).toBe("a*@b.com");
    });

    it("masks malformed input entirely", () => {
      expect(maskEmail("no-at-sign")).toBe("*".repeat("no-at-sign".length));
    });
  });
});
