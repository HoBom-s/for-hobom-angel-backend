/**
 * Audited, compliance-relevant actions. This is the high-integrity trail
 * (written inside the business transaction, never dropped) — distinct from the
 * best-effort access log that rides the outbox.
 */
export enum AuditAction {
  /** An operator/staff viewed unmasked PII (real name, phone). */
  VIEW_PII = "VIEW_PII",
  /** PII was exported/downloaded (DSAR, report). */
  EXPORT_PII = "EXPORT_PII",
  /** Personal data was deleted or anonymized. */
  DELETE_PII = "DELETE_PII",
  /** A consent was recorded. */
  CONSENT_GIVEN = "CONSENT_GIVEN",
  /** A consent was withdrawn. */
  CONSENT_WITHDRAWN = "CONSENT_WITHDRAWN",
}
