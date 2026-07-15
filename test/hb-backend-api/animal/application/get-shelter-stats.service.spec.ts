import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { GetShelterStatsService } from "src/hb-backend-api/animal/application/use-cases/get-shelter-stats.service";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

describe("GetShelterStatsService", () => {
  it("counts ADOPTED as adopted, AVAILABLE/RESERVED/FOSTERED as sheltered, and AVAILABLE-only as available", async () => {
    const shelterId = ShelterId.generate().toString();
    const countByShelterAndStatuses = jest
      .fn()
      .mockImplementation((_id: ShelterId, statuses: AnimalStatus[]) => {
        if (statuses.includes(AnimalStatus.ADOPTED)) {
          return Promise.resolve(12);
        }
        if (statuses.length === 1 && statuses[0] === AnimalStatus.AVAILABLE) {
          return Promise.resolve(3);
        }
        return Promise.resolve(5);
      });
    const service = new GetShelterStatsService({
      countByShelterAndStatuses,
    } as unknown as AnimalQueryPort);

    const stats = await service.invoke(shelterId);

    expect(stats).toEqual({
      adoptedCount: 12,
      shelteredCount: 5,
      availableCount: 3,
    });
    expect(countByShelterAndStatuses).toHaveBeenCalledWith(expect.anything(), [
      AnimalStatus.ADOPTED,
    ]);
    expect(countByShelterAndStatuses).toHaveBeenCalledWith(expect.anything(), [
      AnimalStatus.AVAILABLE,
      AnimalStatus.RESERVED,
      AnimalStatus.FOSTERED,
    ]);
    expect(countByShelterAndStatuses).toHaveBeenCalledWith(expect.anything(), [
      AnimalStatus.AVAILABLE,
    ]);
  });
});
