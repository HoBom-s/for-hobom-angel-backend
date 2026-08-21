/**
 * In-app notification kinds. Mirror the recipient-facing outbox events emitted
 * on domain transitions, so the bell reflects the same moments that trigger the
 * external email/push pipeline.
 */
export enum NotificationType {
  // Decisions to the applicant / registrant.
  ADOPTION_APPROVED = "ADOPTION_APPROVED",
  ADOPTION_REJECTED = "ADOPTION_REJECTED",
  FOSTER_APPROVED = "FOSTER_APPROVED",
  FOSTER_REJECTED = "FOSTER_REJECTED",
  FOSTER_TERMINATED = "FOSTER_TERMINATED",
  SHELTER_VERIFICATION_APPROVED = "SHELTER_VERIFICATION_APPROVED",
  SHELTER_VERIFICATION_REJECTED = "SHELTER_VERIFICATION_REJECTED",
  STAFF_PROMOTION_APPROVED = "STAFF_PROMOTION_APPROVED",
  // Inbound activity to the shelter's representatives.
  NEW_ADOPTION_APPLICATION = "NEW_ADOPTION_APPLICATION",
  NEW_FOSTER_APPLICATION = "NEW_FOSTER_APPLICATION",
  NEW_INQUIRY = "NEW_INQUIRY",
  // A reply arrived in a conversation.
  NEW_MESSAGE = "NEW_MESSAGE",
}
