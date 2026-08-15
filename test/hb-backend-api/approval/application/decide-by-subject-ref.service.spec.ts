import { NotFoundException } from "@nestjs/common";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { DecideApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { DecideBySubjectRefService } from "src/hb-backend-api/approval/application/use-cases/decide-by-subject-ref.service";

const build = (pending: ApprovalRequest | null) => {
  const approvalQueryPort = {
    findPendingBySubjectRef: jest.fn().mockResolvedValue(pending),
  } as unknown as jest.Mocked<ApprovalQueryPort>;
  const decide = {
    invoke: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DecideApprovalUseCase>;
  return {
    approvalQueryPort,
    decide,
    service: new DecideBySubjectRefService(approvalQueryPort, decide),
  };
};

describe("DecideBySubjectRefService", () => {
  const approvalId = ApprovalId.generate();
  const pending = { getId: approvalId } as ApprovalRequest;

  it("resolves the pending approval by subject and delegates to the decider", async () => {
    const { service, approvalQueryPort, decide } = build(pending);

    await service.invoke({
      subjectRef: "app-1",
      type: ApprovalType.ADOPTION,
      actorId: "staff-1",
      decision: ApprovalDecision.approve(),
      reason: undefined,
    });

    expect(approvalQueryPort.findPendingBySubjectRef).toHaveBeenCalledWith(
      "app-1",
      ApprovalType.ADOPTION,
    );
    expect(decide.invoke).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: approvalId, actorId: "staff-1" }),
    );
  });

  it("throws NotFound and never decides when no pending approval exists", async () => {
    const { service, decide } = build(null);

    await expect(
      service.invoke({
        subjectRef: "app-x",
        type: ApprovalType.FOSTER,
        actorId: "staff-1",
        decision: ApprovalDecision.reject(),
        reason: "사유",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(decide.invoke).not.toHaveBeenCalled();
  });
});
