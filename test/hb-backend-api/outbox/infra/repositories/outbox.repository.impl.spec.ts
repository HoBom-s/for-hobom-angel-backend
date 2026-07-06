import { INestApplication } from "@nestjs/common";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Model } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { OutboxSchema } from "src/hb-backend-api/outbox/domain/model/outbox.schema";
import { OutboxRepositoryImpl } from "src/hb-backend-api/outbox/infra/repositories/outbox.repository.impl";

/**
 * Repository-level test: OutboxRepositoryImpl against a real Mongo. Verifies the
 * PENDING row is written with defaults (eventId, status, version).
 */
describe("OutboxRepositoryImpl", () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication;
  let repository: OutboxRepositoryImpl;
  let model: Model<OutboxEntity>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: OutboxEntity.name, schema: OutboxSchema },
        ]),
      ],
      providers: [OutboxRepositoryImpl],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    repository = app.get(OutboxRepositoryImpl);
    model = app.get(getModelToken(OutboxEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("persists a PENDING outbox row with a generated event id", async () => {
    await repository.save(
      CreateOutboxEntity.of(EventType.ADOPTION_APPROVED, {
        subjectRef: "adoption-1",
        recipientUserId: "user-1",
      }),
    );

    const rows = await model.find().lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].eventType).toBe(EventType.ADOPTION_APPROVED);
    expect(rows[0].status).toBe(OutboxStatus.PENDING);
    expect(rows[0].version).toBe(1);
    expect(rows[0].eventId).toEqual(expect.any(String));
  });
});
