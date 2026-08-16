import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { GetShelterVerificationService } from "src/hb-backend-api/shelter/application/use-cases/get-shelter-verification.service";

const operatorId = UserId.generate();
const registrantId = UserId.generate();
const shelterId = "6a65ed6d9579767bbe907e0b";

const operator = { isPlatformAdmin: () => true } as unknown as User;
const plainUser = { isPlatformAdmin: () => false } as unknown as User;
const registrant = { getNickname: { raw: "bom" } } as unknown as User;

const shelterStub = {
  getRepresentatives: [registrantId],
} as unknown as Shelter;

const build = (opts: { viewer: User | null; shelter?: Shelter | null }) => {
  const userQueryPort = {
    findById: jest.fn((id: UserId) =>
      Promise.resolve(
        id.toString() === registrantId.toString() ? registrant : opts.viewer,
      ),
    ),
  } as unknown as jest.Mocked<UserQueryPort>;
  const shelterQueryPort = {
    findById: jest
      .fn()
      .mockResolvedValue("shelter" in opts ? opts.shelter : shelterStub),
  } as unknown as jest.Mocked<ShelterQueryPort>;
  return {
    service: new GetShelterVerificationService(shelterQueryPort, userQueryPort),
    shelterQueryPort,
  };
};

describe("GetShelterVerificationService", () => {
  const query = { shelterId, viewerId: operatorId.toString() };

  it("returns the shelter and the resolved registrant for an operator", async () => {
    const { service } = build({ viewer: operator });

    const view = await service.invoke(query);

    expect(view.shelter).toBe(shelterStub);
    expect(view.registrant).toEqual({
      id: registrantId.toString(),
      nickname: "bom",
    });
  });

  it("forbids a non-operator", async () => {
    const { service, shelterQueryPort } = build({ viewer: plainUser });

    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(shelterQueryPort.findById).not.toHaveBeenCalled();
  });

  it("forbids when the viewer does not exist", async () => {
    const { service } = build({ viewer: null });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("404s when the shelter is gone", async () => {
    const { service } = build({ viewer: operator, shelter: null });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
