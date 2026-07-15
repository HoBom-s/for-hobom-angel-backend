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

  const insert = (over: Partial<OutboxEntity>) =>
    model.create({
      eventId: over.eventId,
      eventType: over.eventType ?? EventType.ADOPTION_APPROVED,
      payload: over.payload ?? { subjectRef: "s" },
      status: over.status ?? OutboxStatus.PENDING,
      retryCount: over.retryCount ?? 0,
      version: over.version ?? 1,
    });

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
    await model.deleteMany({});
  });

  describe("findByEventTypeAndStatus", () => {
    afterEach(async () => {
      await model.deleteMany({});
    });

    it("returns only rows matching type + status, oldest first", async () => {
      await insert({ eventId: "a", status: OutboxStatus.PENDING });
      await insert({ eventId: "b", status: OutboxStatus.PENDING });
      await insert({ eventId: "c", status: OutboxStatus.SENT });
      await insert({
        eventId: "d",
        eventType: EventType.HOBOM_LOG,
        status: OutboxStatus.PENDING,
      });

      const rows = await repository.findByEventTypeAndStatus(
        EventType.ADOPTION_APPROVED,
        OutboxStatus.PENDING,
      );

      expect(rows.map((r) => r.eventId)).toEqual(["a", "b"]);
      expect(rows[0].payload).toEqual({ subjectRef: "s" });
    });
  });

  describe("markAsSent", () => {
    afterEach(async () => {
      await model.deleteMany({});
    });

    it("advances PENDING → SENT once, then is an idempotent no-op", async () => {
      await insert({ eventId: "e1", status: OutboxStatus.PENDING });

      expect(await repository.markAsSent("e1")).toBe(true);
      const sent = await model.findOne({ eventId: "e1" }).lean();
      expect(sent?.status).toBe(OutboxStatus.SENT);
      expect(sent?.sentAt).toBeInstanceOf(Date);
      expect(sent?.version).toBe(2);

      expect(await repository.markAsSent("e1")).toBe(false);
      expect(await repository.markAsSent("missing")).toBe(false);
    });
  });

  describe("markAsFailed", () => {
    afterEach(async () => {
      await model.deleteMany({});
    });

    it("records the error and bumps retryCount", async () => {
      await insert({ eventId: "f1", status: OutboxStatus.PENDING });

      expect(await repository.markAsFailed("f1", "kafka down")).toBe(true);
      const failed = await model.findOne({ eventId: "f1" }).lean();
      expect(failed?.status).toBe(OutboxStatus.FAILED);
      expect(failed?.retryCount).toBe(1);
      expect(failed?.lastError).toBe("kafka down");
    });

    it("never flips a SENT row backwards to FAILED", async () => {
      await insert({ eventId: "s1", status: OutboxStatus.SENT });
      expect(await repository.markAsFailed("s1", "late error")).toBe(false);
      const row = await model.findOne({ eventId: "s1" }).lean();
      expect(row?.status).toBe(OutboxStatus.SENT);
    });
  });
});
