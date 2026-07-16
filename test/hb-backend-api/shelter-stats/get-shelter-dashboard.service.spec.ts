import { ForbiddenException } from "@nestjs/common";
import { GetShelterStatsUseCase } from "src/hb-backend-api/animal/domain/ports/in/get-shelter-stats.use-case";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { GetShelterDashboardService } from "src/hb-backend-api/shelter-stats/application/use-cases/get-shelter-dashboard.service";

const SHELTER = ShelterId.generate().toString();
const ACTOR = ShelterId.generate().toString();

const staff = (canManage: boolean) =>
  ({ canManageShelter: jest.fn().mockReturnValue(canManage) }) as never;

describe("GetShelterDashboardService", () => {
  let getShelterStats: jest.Mocked<GetShelterStatsUseCase>;
  let adoptionQueryPort: jest.Mocked<AdoptionApplicationQueryPort>;
  let fosterQueryPort: jest.Mocked<FosterApplicationQueryPort>;
  let userQueryPort: jest.Mocked<UserQueryPort>;
  let service: GetShelterDashboardService;

  beforeEach(() => {
    getShelterStats = { invoke: jest.fn() };
    adoptionQueryPort = {
      findById: jest.fn(),
      countByApplicantAndStatus: jest.fn(),
      countByShelterAndStatus: jest.fn(),
      countByShelterAndStatusBetween: jest.fn(),
      countByStatus: jest.fn(),
      countByStatusBetween: jest.fn(),
    };
    fosterQueryPort = {
      findById: jest.fn(),
      countByApplicantAndStatus: jest.fn(),
      countByShelterAndStatus: jest.fn(),
      countByStatus: jest.fn(),
    };
    userQueryPort = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserQueryPort>;
    service = new GetShelterDashboardService(
      getShelterStats,
      adoptionQueryPort,
      fosterQueryPort,
      userQueryPort,
    );
  });

  it("rejects an actor who cannot manage the shelter", async () => {
    userQueryPort.findById.mockResolvedValue(staff(false));
    await expect(service.invoke(SHELTER, ACTOR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(getShelterStats.invoke).not.toHaveBeenCalled();
  });

  it("rejects when the actor is not found", async () => {
    userQueryPort.findById.mockResolvedValue(null);
    await expect(service.invoke(SHELTER, ACTOR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("composes counts, adoption rate, trend, and the pending queue", async () => {
    userQueryPort.findById.mockResolvedValue(staff(true));
    getShelterStats.invoke.mockResolvedValue({
      adoptedCount: 12,
      shelteredCount: 4,
      availableCount: 3,
    });
    // 6 month buckets in order oldest→newest.
    adoptionQueryPort.countByShelterAndStatusBetween
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(6);
    adoptionQueryPort.countByShelterAndStatus.mockResolvedValue(2);
    fosterQueryPort.countByShelterAndStatus.mockResolvedValue(1);

    const result = await service.invoke(SHELTER, ACTOR);

    expect(result.adoptedCount).toBe(12);
    expect(result.shelteredCount).toBe(4);
    expect(result.availableCount).toBe(3);
    // 12 / (12 + 4) = 0.75
    expect(result.adoptionRate).toBe(0.75);
    expect(result.monthlyAdoptions).toHaveLength(6);
    expect(result.monthlyAdoptions.map((p) => p.count)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(result.thisMonthAdoptions).toBe(6);
    expect(result.lastMonthAdoptions).toBe(5);
    // adoption PENDING (2) + foster PENDING (1)
    expect(result.pendingApplications).toBe(3);

    expect(adoptionQueryPort.countByShelterAndStatus).toHaveBeenCalledWith(
      expect.any(ShelterId),
      AdoptionApplicationStatus.PENDING,
    );
    expect(fosterQueryPort.countByShelterAndStatus).toHaveBeenCalledWith(
      expect.any(ShelterId),
      FosterApplicationStatus.PENDING,
    );
    expect(
      adoptionQueryPort.countByShelterAndStatusBetween,
    ).toHaveBeenCalledWith(
      expect.any(ShelterId),
      AdoptionApplicationStatus.APPROVED,
      expect.any(Date),
      expect.any(Date),
    );
  });

  it("reports a zero adoption rate when there are no animals", async () => {
    userQueryPort.findById.mockResolvedValue(staff(true));
    getShelterStats.invoke.mockResolvedValue({
      adoptedCount: 0,
      shelteredCount: 0,
      availableCount: 0,
    });
    adoptionQueryPort.countByShelterAndStatusBetween.mockResolvedValue(0);
    adoptionQueryPort.countByShelterAndStatus.mockResolvedValue(0);
    fosterQueryPort.countByShelterAndStatus.mockResolvedValue(0);

    const result = await service.invoke(SHELTER, ACTOR);
    expect(result.adoptionRate).toBe(0);
    expect(result.pendingApplications).toBe(0);
  });
});
