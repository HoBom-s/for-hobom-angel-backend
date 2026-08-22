import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { RemoveShelterStaffService } from "src/hb-backend-api/shelter/application/use-cases/remove-shelter-staff.service";

const shelterId = "6a65ed6d9579767bbe907e0b";
const actorId = UserId.generate().toString();
const targetId = UserId.generate().toString();

const admin = { hasShelterRole: () => true } as unknown as User;
const nonAdmin = { hasShelterRole: () => false } as unknown as User;

const staffTarget = () =>
  ({
    isShelterStaffMember: () => true,
    revokeShelterStaff: jest.fn(),
  }) as unknown as User;

const build = (opts: { actor: User | null; target: User | null }) => {
  const userQueryPort = {
    findById: jest.fn((id: UserId) =>
      Promise.resolve(id.toString() === actorId ? opts.actor : opts.target),
    ),
  } as unknown as jest.Mocked<UserQueryPort>;
  const userPersistencePort = {
    save: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UserPersistencePort>;
  const transactionRunner = {
    run: <T>(fn: () => Promise<T>) => fn(),
  } as unknown as TransactionRunner;
  return {
    service: new RemoveShelterStaffService(
      transactionRunner,
      userQueryPort,
      userPersistencePort,
    ),
    userPersistencePort,
  };
};

const cmd = { shelterId, targetUserId: targetId, actorId };

describe("RemoveShelterStaffService", () => {
  it("revokes the staff grant and persists it for an admin", async () => {
    const target = staffTarget();
    const { service, userPersistencePort } = build({ actor: admin, target });

    await service.invoke(cmd);

    expect(target.revokeShelterStaff).toHaveBeenCalledTimes(1);
    expect(userPersistencePort.save).toHaveBeenCalledWith(target);
  });

  it("forbids a non-admin actor", async () => {
    const { service, userPersistencePort } = build({
      actor: nonAdmin,
      target: staffTarget(),
    });
    await expect(service.invoke(cmd)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(userPersistencePort.save).not.toHaveBeenCalled();
  });

  it("404s when the target does not exist", async () => {
    const { service } = build({ actor: admin, target: null });
    await expect(service.invoke(cmd)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("404s when the target is not a staff member", async () => {
    const target = {
      isShelterStaffMember: () => false,
      revokeShelterStaff: jest.fn(),
    } as unknown as User;
    const { service, userPersistencePort } = build({ actor: admin, target });

    await expect(service.invoke(cmd)).rejects.toBeInstanceOf(NotFoundException);
    expect(target.revokeShelterStaff).not.toHaveBeenCalled();
    expect(userPersistencePort.save).not.toHaveBeenCalled();
  });
});
