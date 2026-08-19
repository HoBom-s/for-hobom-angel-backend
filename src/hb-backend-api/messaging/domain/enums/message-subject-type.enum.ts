/**
 * What a message conversation is about. Each type has a resolver (registered by
 * the owning domain) that maps a subjectRef to the conversation's participants,
 * keeping messaging ignorant of adoption/foster internals.
 */
export enum MessageSubjectType {
  ADOPTION = "ADOPTION",
  FOSTER = "FOSTER",
  /** A general shelter inquiry (문의) opened from an animal, not tied to an application. */
  INQUIRY = "INQUIRY",
}
