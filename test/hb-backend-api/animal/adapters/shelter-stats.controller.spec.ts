import { GetShelterStatsUseCase } from "src/hb-backend-api/animal/domain/ports/in/get-shelter-stats.use-case";
import { ShelterStatsController } from "src/hb-backend-api/animal/adapters/in/shelter-stats.controller";

describe("ShelterStatsController", () => {
  it("delegates to the use-case and maps to the response", async () => {
    const useCase: jest.Mocked<GetShelterStatsUseCase> = {
      invoke: jest
        .fn()
        .mockResolvedValue({ adoptedCount: 3, shelteredCount: 7 }),
    };
    const controller = new ShelterStatsController(useCase);

    const res = await controller.stats("shelter-1");

    expect(useCase.invoke).toHaveBeenCalledWith("shelter-1");
    expect(res).toEqual({ adoptedCount: 3, shelteredCount: 7 });
  });
});
