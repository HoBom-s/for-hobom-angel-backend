import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";

/**
 * Typed payload builders per event type. Keeps event payload shapes in one place
 * so producers can't drift from what the internal-backend consumer expects.
 * Every notification-bearing event carries a `recipient` channel target.
 */
export interface ApprovalPayloadInput {
  subjectRef: string;
  recipientUserId: string;
  shelterId?: string;
  occurredAt: string;
}

export interface FosterTerminationPayloadInput {
  fosterProcessId: string;
  animalId: string;
  recipientUserId: string;
  reason: "EXPIRED" | "EARLY_TERMINATED";
  occurredAt: string;
}

interface PayloadFactoryMap {
  [EventType.ADOPTION_APPROVED]: (
    input: ApprovalPayloadInput,
  ) => Record<string, unknown>;
  [EventType.FOSTER_APPROVED]: (
    input: ApprovalPayloadInput,
  ) => Record<string, unknown>;
  [EventType.STAFF_PROMOTION_APPROVED]: (
    input: ApprovalPayloadInput,
  ) => Record<string, unknown>;
  [EventType.SHELTER_VERIFICATION_APPROVED]: (
    input: ApprovalPayloadInput,
  ) => Record<string, unknown>;
  [EventType.FOSTER_TERMINATED]: (
    input: FosterTerminationPayloadInput,
  ) => Record<string, unknown>;
}

const approvalPayload = (
  input: ApprovalPayloadInput,
): Record<string, unknown> => ({ ...input });

export const OutboxPayloadFactoryRegistry: PayloadFactoryMap = {
  [EventType.ADOPTION_APPROVED]: approvalPayload,
  [EventType.FOSTER_APPROVED]: approvalPayload,
  [EventType.STAFF_PROMOTION_APPROVED]: approvalPayload,
  [EventType.SHELTER_VERIFICATION_APPROVED]: approvalPayload,
  [EventType.FOSTER_TERMINATED]: (input) => ({ ...input }),
};
