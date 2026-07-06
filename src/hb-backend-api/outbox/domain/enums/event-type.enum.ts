/**
 * Outbox event types for Angel. All flow through the single Kafka topic
 * `hobom.angel-events`; the type selects the payload factory and the downstream
 * notification handler. Add new types alongside a payload factory (see
 * {@link OutboxPayloadFactoryRegistry}).
 */
export enum EventType {
  ADOPTION_APPROVED = "ADOPTION_APPROVED",
  FOSTER_APPROVED = "FOSTER_APPROVED",
  FOSTER_TERMINATED = "FOSTER_TERMINATED",
  STAFF_PROMOTION_APPROVED = "STAFF_PROMOTION_APPROVED",
  SHELTER_VERIFICATION_APPROVED = "SHELTER_VERIFICATION_APPROVED",
  /** Best-effort HTTP access log (redacted) shipped via the outbox. */
  HOBOM_LOG = "HOBOM_LOG",
}
