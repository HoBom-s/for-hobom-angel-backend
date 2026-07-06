/**
 * Central registry for Symbol-based DI tokens.
 *
 * Every cross-layer binding (in-port → use-case, out-port → adapter,
 * repository interface → impl) is wired through a unique `Symbol`. Using the
 * class-field pattern in {@link DIToken} keeps tokens discoverable and typo-safe.
 */
export abstract class TokenRegistry {
  /** Create a unique DI token from a dotted path (e.g. "outbox.persistence"). */
  protected register(path: string): symbol {
    return Symbol(path);
  }
}
