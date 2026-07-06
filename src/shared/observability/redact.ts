const REDACTED = "[REDACTED]";
const MAX_DEPTH = 4;

/** Request headers that must never reach the log pipeline in cleartext. */
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-hobom-api-key",
]);

/** Body/query keys carrying PII or secrets. Matched case-insensitively. */
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "phone",
  "realname",
  "name",
  "ci",
  "di",
  "email",
  "rrn",
  "ssn",
  "secret",
]);

/** Redacts sensitive headers, passing everything else through unchanged. */
export function redactHeaders(
  headers: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    out[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? REDACTED : value;
  }
  return out;
}

/**
 * Deep-redacts PII/secret-bearing keys from an arbitrary value (query/body),
 * bounded in depth so a pathological payload can't blow the stack. This is the
 * guard that keeps the access-log stream (outbox → Kafka → storage) free of
 * cleartext personal data.
 */
export function redactPii(value: unknown, depth = 0): unknown {
  if (value == null || depth > MAX_DEPTH) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactPii(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase())
        ? REDACTED
        : redactPii(val, depth + 1);
    }
    return out;
  }
  return value;
}
