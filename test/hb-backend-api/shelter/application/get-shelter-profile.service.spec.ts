import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { GetShelterProfileService } from "src/hb-backend-api/shelter/application/use-cases/get-shelter-profile.service";

const shelterId = "6a65ed6d9579767bbe907e0b";
const actorId = "6a65ed6d9579767bbe907e1c";

const manager = { canManageShelter: () => true } as unknown as User;
const outsider = { canManageShelter: () => false } as unknown as User;
const shelterStub = {} as Shelter;

const build = (opts: { actor: User | null; shelter?: Shelter | null }) => {
  const userQueryPort = {
    findById: jest.fn().mockResolvedValue(opts.actor),
  } as unknown as jest.Mocked<UserQueryPort>;
  const shelterQueryPort = {
    findById: jest
      .fn()
      .mockResolvedValue("shelter" in opts ? opts.shelter : shelterStub),
  } as unknown as jest.Mocked<ShelterQueryPort>;
  return {
    service: new GetShelterProfileService(shelterQueryPort, userQueryPort),
    shelterQueryPort,
  };
};

describe("GetShelterProfileService", () => {
  const query = { shelterId, actorId };

  it("returns the shelter for a staff member", async () => {
    const { service } = build({ actor: manager });
    await expect(service.invoke(query)).resolves.toBe(shelterStub);
  });

  it("forbids a non-staff user and never loads the shelter", async () => {
    const { service, shelterQueryPort } = build({ actor: outsider });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(shelterQueryPort.findById).not.toHaveBeenCalled();
  });

  it("forbids when the actor does not exist", async () => {
    const { service } = build({ actor: null });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("404s when the shelter is gone", async () => {
    const { service } = build({ actor: manager, shelter: null });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
