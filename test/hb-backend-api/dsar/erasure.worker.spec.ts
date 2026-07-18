import { ErasureWorker } from "src/hb-backend-api/dsar/schedule/erasure.worker";

describe("ErasureWorker (daily 3am sweep)", () => {
  const build = (subjectIds: string[]) => {
    const userQueryPort = {
      findWithdrawnToPurge: jest.fn().mockResolvedValue(subjectIds),
    };
    const engine = { erase: jest.fn().mockResolvedValue({}) };
    const worker = new ErasureWorker(userQueryPort as never, engine as never);
    return { worker, engine };
  };

  it("erases every withdrawn account past its grace, as the system actor", async () => {
    const { worker, engine } = build(["s1", "s2"]);
    await worker.handle();

    expect(engine.erase).toHaveBeenCalledTimes(2);
    expect(engine.erase).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "system", subjectId: "s1" }),
    );
  });

  it("does nothing when there is nothing to purge", async () => {
    const { worker, engine } = build([]);
    await worker.handle();
    expect(engine.erase).not.toHaveBeenCalled();
  });

  it("continues the batch when one subject fails", async () => {
    const { worker, engine } = build(["s1", "s2"]);
    engine.erase
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({});
    await expect(worker.handle()).resolves.toBeUndefined();
    expect(engine.erase).toHaveBeenCalledTimes(2);
  });
});
