import { ForbiddenException } from "@nestjs/common";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { GetShelterStaffService } from "src/hb-backend-api/shelter/application/use-cases/get-shelter-staff.service";

const shelterId = ShelterId.generate();

const staff = (canManage: boolean) =>
  ({ canManageShelter: jest.fn().mockReturnValue(canManage) }) as never;

const build = (over: { actor?: unknown; roster?: User[] }) => {
  const roster = over.roster ?? [];
  const userQueryPort = {
    findById: jest
      .fn()
      .mockResolvedValue(over.actor === undefined ? staff(true) : over.actor),
    findByShelter: jest.fn().mockResolvedValue(roster),
  } as unknown as jest.Mocked<UserQueryPort>;
  return {
    userQueryPort,
    service: new GetShelterStaffService(userQueryPort),
  };
};

describe("GetShelterStaffService", () => {
  const query = {
    shelterId: shelterId.toString(),
    actorId: UserId.generate().toString(),
  };

  it("forbids a caller who cannot manage the shelter", async () => {
    const { service } = build({ actor: staff(false) });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("forbids when the caller does not exist", async () => {
    const { service } = build({ actor: null });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("returns the roster (capped) for a managing caller", async () => {
    const roster = [staff(true), staff(true)] as unknown as User[];
    const { service, userQueryPort } = build({ actor: staff(true), roster });

    const result = await service.invoke(query);

    expect(result).toBe(roster);
    expect(userQueryPort.findByShelter).toHaveBeenCalledWith(
      expect.any(ShelterId),
      200,
    );
  });
});
