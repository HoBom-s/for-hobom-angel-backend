import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { GetCurrentPolicyService } from "src/hb-backend-api/policy/application/use-cases/get-current-policy.service";
import { ListPolicyVersionsService } from "src/hb-backend-api/policy/application/use-cases/list-policy-versions.service";

const actorId = new Types.ObjectId().toString();
const admin = { isPlatformAdmin: () => true };
const member = { isPlatformAdmin: () => false };

describe("GetCurrentPolicyService", () => {
  const build = (current: unknown) => {
    const queryPort = {
      findCurrent: jest.fn().mockResolvedValue(current),
      findVersions: jest.fn(),
      nextVersion: jest.fn(),
    };
    return new GetCurrentPolicyService(queryPort);
  };

  it("404s when no version is published", async () => {
    await expect(
      build(null).invoke(PolicyType.PRIVACY_POLICY),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns the current version", async () => {
    const doc = { getVersion: 2 };
    expect(await build(doc).invoke(PolicyType.PRIVACY_POLICY)).toBe(doc);
  });
});

describe("ListPolicyVersionsService", () => {
  const build = (actor: unknown, versions: unknown[] = []) => {
    const userQueryPort = { findById: jest.fn().mockResolvedValue(actor) };
    const queryPort = {
      findCurrent: jest.fn(),
      findVersions: jest.fn().mockResolvedValue(versions),
      nextVersion: jest.fn(),
    };
    return new ListPolicyVersionsService(userQueryPort as never, queryPort);
  };

  it("rejects a non-operator", async () => {
    await expect(
      build(member).invoke({ actorId, type: PolicyType.TERMS_OF_SERVICE }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns the version history for an operator", async () => {
    const versions = [{ getVersion: 2 }, { getVersion: 1 }];
    const result = await build(admin, versions).invoke({
      actorId,
      type: PolicyType.TERMS_OF_SERVICE,
    });
    expect(result).toHaveLength(2);
  });
});
