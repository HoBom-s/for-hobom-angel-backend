import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";

/**
 * Password hashing for the email+password credential. bcrypt with a per-hash
 * salt; the cost factor is deliberately high (slow by design) to resist offline
 * cracking. Plaintext passwords never leave the request — only the hash is stored.
 */
@Injectable()
export class PasswordHasher {
  private static readonly COST = 12;

  public hash(plain: string): Promise<string> {
    return hash(plain, PasswordHasher.COST);
  }

  public compare(plain: string, passwordHash: string): Promise<boolean> {
    return compare(plain, passwordHash);
  }
}
