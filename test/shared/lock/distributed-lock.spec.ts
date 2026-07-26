import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Connection, Model } from "mongoose";
import { DistributedLock } from "src/shared/lock/distributed-lock";
import { LockEntity } from "src/shared/lock/lock.entity";
import { LockSchema } from "src/shared/lock/lock.schema";

describe("DistributedLock", () => {
  let mongo: MongoMemoryServer;
  let conn: Connection;
  let model: Model<LockEntity>;
  let a: DistributedLock;
  let b: DistributedLock;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    conn = await mongoose.createConnection(mongo.getUri()).asPromise();
    model = conn.model(LockEntity.name, LockSchema);
    // Two instances = two separate replicas contending for the same lock.
    a = new DistributedLock(model);
    b = new DistributedLock(model);
  }, 60_000);

  afterAll(async () => {
    await conn?.close();
    await mongo?.stop();
  });

  it("lets only one holder run at a time", async () => {
    let bResult: string | null = "unset";

    const aResult = await a.runExclusive("job", 60_000, async () => {
      // While A holds the lock, B must be turned away.
      bResult = await b.runExclusive("job", 60_000, () =>
        Promise.resolve("b-ran"),
      );
      return "a-ran";
    });

    expect(aResult).toBe("a-ran");
    expect(bResult).toBeNull();
  });

  it("frees the lock once the holder finishes", async () => {
    // A released after the previous test → B can now take it.
    const bResult = await b.runExclusive("job", 60_000, () =>
      Promise.resolve("b-ran"),
    );
    expect(bResult).toBe("b-ran");
  });

  it("can be taken over once expired (ttl = 0)", async () => {
    // A holds it but with a zero-length ttl → immediately expired → B takes over.
    await a.runExclusive("expiring", 0, () => Promise.resolve());
    const taken = await b.runExclusive("expiring", 60_000, () =>
      Promise.resolve("b-took-over"),
    );
    expect(taken).toBe("b-took-over");
  });
});
