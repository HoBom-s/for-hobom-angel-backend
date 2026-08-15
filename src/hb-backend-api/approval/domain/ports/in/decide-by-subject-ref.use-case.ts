import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";

export interface DecideBySubjectRefCommand {
  /** The subject the approval was opened for (e.g. an application id). */
  subjectRef: string;
  type: ApprovalType;
  actorId: string;
  decision: ApprovalDecision;
  reason?: string;
}

/**
 * Decides the PENDING approval for a given subject + type. A convenience over
 * {@link DecideApprovalUseCase} that resolves the approval id internally, so a
 * consumer domain (adoption/foster) can offer "decide this application" without
 * surfacing the engine's approval id in its own contract. Authorization and the
 * domain transition are the callback's, exactly as for a direct decision.
 */
export interface DecideBySubjectRefUseCase {
  invoke(command: DecideBySubjectRefCommand): Promise<void>;
}
