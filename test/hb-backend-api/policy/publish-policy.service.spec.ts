import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Types } from "mongoose";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PublishPolicyService } from "src/hb-backend-api/policy/application/use-cases/publish-policy.service";

const actorId = new Types.ObjectId().toString();
const admin = { isPlatformAdmin: () => true };
const member = { isPlatformAdmin: () => false };

describe("PublishPolicyService", () => {
  const build = (actor: unknown, nextVersion = 1) => {
    const txRunner = {
      run: (fn: () => Promise<unknown>) => fn(),
    } as unknown as TransactionRunner;
    const userQueryPort = { findById: jest.fn().mockResolvedValue(actor) };
    const persistencePort = {
      archiveCurrent: jest.fn(),
      save: jest.fn((d: PolicyDocument) => Promise.resolve(d)),
    };
    const queryPort = {
      findCurrent: jest.fn(),
      findVersions: jest.fn(),
      nextVersion: jest.fn().mockResolvedValue(nextVersion),
    };
    const service = new PublishPolicyService(
      txRunner,
      userQueryPort as never,
      persistencePort,
      queryPort,
    );
    return { service, persistencePort, queryPort };
  };

  const cmd = () => ({
    actorId,
    type: PolicyType.PRIVACY_POLICY,
    title: "개인정보 처리방침",
    content: "본문",
  });

  it("rejects a non-operator", async () => {
    const { service } = build(member);
    await expect(service.invoke(cmd())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("archives the current version then publishes the next", async () => {
    const { service, persistencePort } = build(admin, 4);
    const result = await service.invoke(cmd());

    expect(persistencePort.archiveCurrent).toHaveBeenCalledWith(
      PolicyType.PRIVACY_POLICY,
    );
    expect(persistencePort.save).toHaveBeenCalledTimes(1);
    expect(result.getVersion).toBe(4);
    expect(result.getStatus).toBe(PolicyStatus.PUBLISHED);
  });

  it("rejects an invalid effectiveDate", async () => {
    const { service } = build(admin);
    await expect(
      service.invoke({ ...cmd(), effectiveDate: "not-a-date" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
