import { ForbiddenException } from "@nestjs/common";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { ApprovalCallback } from "src/hb-backend-api/approval/domain/ports/out/approval-callback";
import { ApprovalPersistencePort } from "src/hb-backend-api/approval/domain/ports/out/approval-persistence.port";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { ApprovalCallbackRegistry } from "src/hb-backend-api/approval/application/approval-callback.registry";
import { DecideApprovalService } from "src/hb-backend-api/approval/application/use-cases/decide-approval.service";

// The engine is domain-agnostic; per-type authorization lives in the callback.
// These tests pin the invariant that the engine calls authorize() BEFORE any
// mutation and aborts the whole decision when it throws.
const pendingRequest = () =>
  ApprovalRequest.reconstitute({
    id: ApprovalId.generate(),
    type: ApprovalType.SHELTER_VERIFICATION,
    subjectRef: ApprovalId.generate().toString(),
    requesterId: "requester-1",
    status: ApprovalStatus.PENDING,
    decidedBy: null,
    decidedAt: null,
    reason: null,
    decisionMetadata: null,
    version: 0,
  });

const build = () => {
  const request = pendingRequest();
  const callback = {
    type: ApprovalType.SHELTER_VERIFICATION,
    authorize: jest.fn().mockResolvedValue(undefined),
    onApproved: jest.fn().mockResolvedValue(undefined),
    onRejected: jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<ApprovalCallback>;

  const approvalQueryPort = {
    findById: jest.fn().mockResolvedValue(request),
  } as unknown as jest.Mocked<ApprovalQueryPort>;
  const approvalPersistencePort = {
    save: jest.fn().mockResolvedValue(undefined),
    appendAction: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ApprovalPersistencePort>;
  const callbacks = {
    get: jest.fn().mockReturnValue(callback),
  } as unknown as ApprovalCallbackRegistry;
  const transactionRunner = {
    run: <T>(fn: () => Promise<T>) => fn(),
  } as unknown as TransactionRunner;

  const service = new DecideApprovalService(
    transactionRunner,
    approvalQueryPort,
    approvalPersistencePort,
    callbacks,
  );
  return { service, request, callback, approvalPersistencePort };
};

describe("DecideApprovalService — authorization gate", () => {
  it("aborts without mutating when the callback denies the actor", async () => {
    const { service, callback, approvalPersistencePort } = build();
    callback.authorize.mockRejectedValue(new ForbiddenException("nope"));

    await expect(
      service.invoke({
        requestId: ApprovalId.generate(),
        actorId: "intruder-1",
        decision: ApprovalDecision.approve(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(approvalPersistencePort.save).not.toHaveBeenCalled();
    expect(approvalPersistencePort.appendAction).not.toHaveBeenCalled();
    expect(callback.onApproved).not.toHaveBeenCalled();
    expect(callback.onRejected).not.toHaveBeenCalled();
  });

  it("authorizes the actor before running the approval effect", async () => {
    const { service, request, callback, approvalPersistencePort } = build();

    await service.invoke({
      requestId: ApprovalId.generate(),
      actorId: "operator-1",
      decision: ApprovalDecision.approve(),
    });

    expect(callback.authorize).toHaveBeenCalledWith(request, "operator-1");
    expect(approvalPersistencePort.save).toHaveBeenCalledWith(request);
    expect(approvalPersistencePort.appendAction).toHaveBeenCalledTimes(1);
    expect(callback.onApproved).toHaveBeenCalledWith(request);
    expect(callback.onRejected).not.toHaveBeenCalled();
  });
});
