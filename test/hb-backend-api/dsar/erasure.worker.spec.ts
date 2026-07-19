import { ErasureWorker } from "src/hb-backend-api/dsar/schedule/erasure.worker";

// Fake lock that always "acquires" and runs the wrapped work.
const fakeLock = {
  runExclusive: (_k: string, _t: number, fn: () => Promise<unknown>) => fn(),
};

describe("ErasureWorker (daily 3am sweep)", () => {
  const build = (subjectIds: string[]) => {
    const userQueryPort = {
      findWithdrawnToPurge: jest.fn().mockResolvedValue(subjectIds),
    };
    const engine = { erase: jest.fn().mockResolvedValue({}) };
    const worker = new ErasureWorker(
      userQueryPort as never,
      engine as never,
      fakeLock as never,
    );
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

  it("drains beyond a single page (no 200 silent cap)", async () => {
    // A full 200-id page keeps the loop going; a short page ends it.
    const fullPage = Array.from({ length: 200 }, (_, i) => `a${i}`);
    const tail = Array.from({ length: 30 }, (_, i) => `b${i}`);
    const userQueryPort = {
      findWithdrawnToPurge: jest
        .fn()
        .mockResolvedValueOnce(fullPage)
        .mockResolvedValueOnce(tail)
        .mockResolvedValue([]),
    };
    const engine = { erase: jest.fn().mockResolvedValue({}) };
    const worker = new ErasureWorker(
      userQueryPort as never,
      engine as never,
      fakeLock as never,
    );

    await worker.handle();

    expect(engine.erase).toHaveBeenCalledTimes(230);
  });

  it("stops on poison accounts instead of looping forever", async () => {
    // The same full page comes back every scan and every erase fails.
    const poison = Array.from({ length: 200 }, (_, i) => `p${i}`);
    const userQueryPort = {
      findWithdrawnToPurge: jest.fn().mockResolvedValue(poison),
    };
    const engine = {
      erase: jest.fn().mockRejectedValue(new Error("poison")),
    };
    const worker = new ErasureWorker(
      userQueryPort as never,
      engine as never,
      fakeLock as never,
    );

    await worker.handle();

    // Each poison id is attempted exactly once; the second scan makes no
    // progress (all already seen) and the loop exits.
    expect(engine.erase).toHaveBeenCalledTimes(200);
    expect(userQueryPort.findWithdrawnToPurge).toHaveBeenCalledTimes(2);
  });
});
