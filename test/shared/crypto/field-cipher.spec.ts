import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { FieldCipher } from "src/shared/crypto/field-cipher";

const cipherWith = (env: Record<string, string | undefined>): FieldCipher => {
  const config = {
    get: (key: string) => env[key],
  } as unknown as ConfigService;
  const cipher = new FieldCipher(config);
  cipher.onModuleInit();
  return cipher;
};

const KEY = randomBytes(32).toString("base64");

describe("FieldCipher", () => {
  it("round-trips plaintext with a configured key", () => {
    const cipher = cipherWith({ FIELD_ENCRYPTION_KEY: KEY });
    const encrypted = cipher.encrypt("홍길동");
    expect(encrypted).not.toBe("홍길동");
    expect(cipher.decrypt(encrypted)).toBe("홍길동");
  });

  it("produces distinct ciphertexts for the same plaintext (random IV)", () => {
    const cipher = cipherWith({ FIELD_ENCRYPTION_KEY: KEY });
    expect(cipher.encrypt("x")).not.toBe(cipher.encrypt("x"));
  });

  it("detects tampering via the GCM auth tag", () => {
    const cipher = cipherWith({ FIELD_ENCRYPTION_KEY: KEY });
    const encrypted = cipher.encrypt("secret");
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff; // flip a ciphertext byte
    expect(() => cipher.decrypt(buf.toString("base64"))).toThrow();
  });

  it("throws when the key is not 32 bytes", () => {
    expect(() =>
      cipherWith({ FIELD_ENCRYPTION_KEY: Buffer.alloc(16).toString("base64") }),
    ).toThrow();
  });

  it("is a no-op passthrough in dev when no key is set", () => {
    const cipher = cipherWith({ FIELD_ENCRYPTION_KEY: undefined });
    expect(cipher.encrypt("plain")).toBe("plain");
    expect(cipher.decrypt("plain")).toBe("plain");
  });

  it("fails loudly in production when no key is set", () => {
    expect(() =>
      cipherWith({ FIELD_ENCRYPTION_KEY: undefined, NODE_ENV: "production" }),
    ).toThrow();
  });
});
