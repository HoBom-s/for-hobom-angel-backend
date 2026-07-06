import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM field-level encryption for PII at rest (real name, phone).
 * Key material lives OUTSIDE the DB (env → KMS/secret manager).
 * RRN is never stored. Ciphertext format (base64):
 *
 *   iv(12) || authTag(16) || ciphertext
 *
 * A version byte is prepended to allow future key rotation.
 */
@Injectable()
export class FieldCipher implements OnModuleInit {
  private readonly logger = new Logger(FieldCipher.name);
  private static readonly ALGO = "aes-256-gcm";
  private static readonly IV_LEN = 12;
  private static readonly TAG_LEN = 16;
  private static readonly VERSION = 0x01;

  private key: Buffer | null = null;

  constructor(private readonly config: ConfigService) {}

  public onModuleInit(): void {
    const raw = this.config.get<string>("FIELD_ENCRYPTION_KEY");
    if (!raw) {
      // Fail loud in prod; allow boot in local dev so the skeleton runs.
      if (this.config.get("NODE_ENV") === "production") {
        throw new Error("FIELD_ENCRYPTION_KEY is required in production");
      }
      this.logger.warn(
        "FIELD_ENCRYPTION_KEY unset — PII encryption disabled (dev only).",
      );
      return;
    }
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
      throw new Error(
        "FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
      );
    }
    this.key = key;
  }

  public encrypt(plaintext: string): string {
    if (!this.key) {
      return plaintext;
    }
    const iv = randomBytes(FieldCipher.IV_LEN);
    const cipher = createCipheriv(FieldCipher.ALGO, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([
      Buffer.from([FieldCipher.VERSION]),
      iv,
      tag,
      ciphertext,
    ]).toString("base64");
  }

  public decrypt(encoded: string): string {
    if (!this.key) {
      return encoded;
    }
    const buf = Buffer.from(encoded, "base64");
    if (buf.length < 1 + FieldCipher.IV_LEN + FieldCipher.TAG_LEN) {
      throw new Error("Ciphertext too short");
    }
    let offset = 1; // skip version byte
    const iv = buf.subarray(offset, offset + FieldCipher.IV_LEN);
    offset += FieldCipher.IV_LEN;
    const tag = buf.subarray(offset, offset + FieldCipher.TAG_LEN);
    offset += FieldCipher.TAG_LEN;
    const ciphertext = buf.subarray(offset);

    const decipher = createDecipheriv(FieldCipher.ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  }
}
