/**
 * A policy version's lifecycle. Exactly one PUBLISHED version exists per type at
 * a time (the one served to users); publishing a new one ARCHIVES the previous.
 */
export enum PolicyStatus {
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}
