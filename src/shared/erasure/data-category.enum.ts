/**
 * The kinds of personal data the erasure engine knows how to dispose of. Each
 * {@link Destroyer} owns exactly one category for one module — a domain that
 * holds several kinds (e.g. posts + likes) registers several destroyers.
 */
export enum DataCategory {
  IDENTITY = "IDENTITY", // real name, phone, email, nickname
  CREDENTIALS = "CREDENTIALS", // refresh tokens
  APPLICATIONS = "APPLICATIONS", // adoption/foster applications + questionnaire
  MESSAGES = "MESSAGES", // applicant ↔ shelter messages
  SOCIAL = "SOCIAL", // reviews, posts, comments
  ENGAGEMENT = "ENGAGEMENT", // likes, bookmarks, favorites, signups
  MODERATION = "MODERATION", // reports, approvals
  MEMBERSHIP = "MEMBERSHIP", // shelter staff links
  EVENT_LOG = "EVENT_LOG", // outbox payloads
  AUDIT = "AUDIT", // audit trail (RETAINED)
  SAFETY = "SAFETY", // adopter blacklist (RETAINED, pseudonymized)
}
