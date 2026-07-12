import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";

/** The two sides of a conversation, as opaque id strings. */
export interface ConversationParticipants {
  shelterId: string;
  applicantId: string;
}

/**
 * Resolves a conversation's participants from its subject reference. The owning
 * domain (adoption/foster) registers one per {@link MessageSubjectType} into the
 * registry, so messaging never depends on those domains' internals — the same
 * plug-in shape as the approval-callback registry.
 */
export interface MessageSubjectResolver {
  readonly subjectType: MessageSubjectType;
  resolve(subjectRef: string): Promise<ConversationParticipants | null>;
}
