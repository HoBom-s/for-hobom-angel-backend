/**
 * In-app notification kinds. Mirror the recipient-facing outbox events emitted
 * on domain transitions, so the bell reflects the same moments that trigger the
 * external email/push pipeline.
 */
export enum NotificationType {
  ADOPTION_APPROVED = "ADOPTION_APPROVED",
  FOSTER_APPROVED = "FOSTER_APPROVED",
  FOSTER_TERMINATED = "FOSTER_TERMINATED",
  SHELTER_VERIFICATION_APPROVED = "SHELTER_VERIFICATION_APPROVED",
  STAFF_PROMOTION_APPROVED = "STAFF_PROMOTION_APPROVED",
}
