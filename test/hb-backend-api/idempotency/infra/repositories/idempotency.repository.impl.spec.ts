import { INestApplication } from "@nestjs/common";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Model } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { IdempotencyConflictException } from "src/hb-backend-api/idempotency/domain/exception/idempotency-conflict.exception";
import { IdempotencyKeyEntity } from "src/hb-backend-api/idempotency/domain/model/idempotency-key.entity";
import { IdempotencyKeySchema } from "src/hb-backend-api/idempotency/domain/model/idempotency-key.schema";
import { IdempotencyRepositoryImpl } from "src/hb-backend-api/idempotency/infra/repositories/idempotency.repository.impl";

describe("IdempotencyRepositoryImpl", () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication;
  let repository: IdempotencyRepositoryImpl;
  let model: Model<IdempotencyKeyEntity>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: IdempotencyKeyEntity.name, schema: IdempotencyKeySchema },
        ]),
      ],
      providers: [IdempotencyRepositoryImpl],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    repository = app.get(IdempotencyRepositoryImpl);
    model = app.get(getModelToken(IdempotencyKeyEntity.name));
    // Ensure the unique (scope,key) index exists before the duplicate test.
    await model.syncIndexes();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("reserves a fresh key", async () => {
    await expect(repository.reserve("adoption", "k1")).resolves.toBeUndefined();
    expect(await model.countDocuments({ scope: "adoption", key: "k1" })).toBe(
      1,
    );
  });

  it("rejects a duplicate (scope, key)", async () => {
    await repository.reserve("foster", "dup");
    await expect(repository.reserve("foster", "dup")).rejects.toThrow(
      IdempotencyConflictException,
    );
  });

  it("allows the same key under a different scope", async () => {
    await repository.reserve("scope-a", "shared");
    await expect(
      repository.reserve("scope-b", "shared"),
    ).resolves.toBeUndefined();
  });
});
