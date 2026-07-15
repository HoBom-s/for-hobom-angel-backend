import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { GetShelterStatsService } from "src/hb-backend-api/animal/application/use-cases/get-shelter-stats.service";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

describe("GetShelterStatsService", () => {
  it("counts ADOPTED as adopted and AVAILABLE/RESERVED/FOSTERED as sheltered", async () => {
    const shelterId = ShelterId.generate().toString();
    const countByShelterAndStatuses = jest
      .fn()
      .mockImplementation((_id: ShelterId, statuses: AnimalStatus[]) =>
        Promise.resolve(statuses.includes(AnimalStatus.ADOPTED) ? 12 : 5),
      );
    const service = new GetShelterStatsService({
      countByShelterAndStatuses,
    } as unknown as AnimalQueryPort);

    const stats = await service.invoke(shelterId);

    expect(stats).toEqual({ adoptedCount: 12, shelteredCount: 5 });
    expect(countByShelterAndStatuses).toHaveBeenCalledWith(expect.anything(), [
      AnimalStatus.ADOPTED,
    ]);
    expect(countByShelterAndStatuses).toHaveBeenCalledWith(expect.anything(), [
      AnimalStatus.AVAILABLE,
      AnimalStatus.RESERVED,
      AnimalStatus.FOSTERED,
    ]);
  });
});
