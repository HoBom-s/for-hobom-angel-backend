import { CloseExpiredVolunteerEventsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/close-expired-volunteer-events.use-case";
import { VolunteerExpirySchedule } from "src/hb-backend-api/volunteer/adapters/in/schedule/volunteer-expiry.schedule";

const make = (closed: number) => {
  const useCase = {
    invoke: jest.fn().mockResolvedValue({ closed }),
  } as unknown as CloseExpiredVolunteerEventsUseCase;
  const lock = {
    runExclusive: (_k: string, _t: number, fn: () => Promise<unknown>) => fn(),
  };
  return {
    schedule: new VolunteerExpirySchedule(useCase, lock as never),
    useCase,
  };
};

describe("VolunteerExpirySchedule", () => {
  it("runs the close-expired sweep on each tick", async () => {
    const { schedule, useCase } = make(3);
    await schedule.handle();
    expect(useCase.invoke).toHaveBeenCalledTimes(1);
  });

  it("is a quiet no-op when nothing expired", async () => {
    const { schedule, useCase } = make(0);
    await schedule.handle();
    expect(useCase.invoke).toHaveBeenCalledTimes(1);
  });
});
