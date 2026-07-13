import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";
import { CloseExpiredVolunteerEventsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/close-expired-volunteer-events.use-case";

/**
 * Scheduled sweep: OPEN events whose end time has passed are auto-closed; future
 * OPEN events and already CLOSED/CANCELLED ones are left untouched.
 */
describe("Volunteer expiry (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let closeExpired: CloseExpiredVolunteerEventsUseCase;
  let eventModel: Model<VolunteerEventEntity>;

  const shelterId = new Types.ObjectId();
  let seq = 0;

  const seedEvent = async (
    status: VolunteerEventStatus,
    endAt: Date,
  ): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await eventModel.create({
      _id: id,
      shelterId,
      title: `event-${seq}`,
      description: "",
      startAt: new Date(endAt.getTime() - 3_600_000),
      endAt,
      capacity: 10,
      signedUpCount: 0,
      status,
      version: 0,
    });
    return id.toHexString();
  };

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB = mongo.getUri();
    process.env.NODE_ENV = "test";
    process.env.HOBOM_JWT_SECRET = "test-access-secret";
    process.env.HOBOM_JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.HOBOM_JWT_ACCESS_TOKEN_EXPIRED = "15m";
    process.env.HOBOM_JWT_REFRESH_TOKEN_EXPIRED = "30d";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

    const { AppModule } = await import("src/app.module");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    closeExpired = app.get(
      DIToken.VolunteerModule.CloseExpiredVolunteerEventsUseCase,
    );
    eventModel = app.get(getModelToken(VolunteerEventEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("closes only OPEN events past their end time", async () => {
    const past = new Date(Date.now() - 3_600_000);
    const future = new Date(Date.now() + 3_600_000);

    const expired1 = await seedEvent(VolunteerEventStatus.OPEN, past);
    const expired2 = await seedEvent(VolunteerEventStatus.OPEN, past);
    const upcoming = await seedEvent(VolunteerEventStatus.OPEN, future);
    const alreadyClosed = await seedEvent(VolunteerEventStatus.CLOSED, past);

    const { closed } = await closeExpired.invoke();
    expect(closed).toBe(2);

    const status = async (id: string) =>
      (await eventModel.findById(id).lean().exec())?.status;
    expect(await status(expired1)).toBe(VolunteerEventStatus.CLOSED);
    expect(await status(expired2)).toBe(VolunteerEventStatus.CLOSED);
    expect(await status(upcoming)).toBe(VolunteerEventStatus.OPEN); // future
    expect(await status(alreadyClosed)).toBe(VolunteerEventStatus.CLOSED);

    // version bumped only on the ones we closed
    const e1 = await eventModel.findById(expired1).lean().exec();
    expect(e1?.version).toBe(1);
  });

  it("is a no-op when nothing has expired", async () => {
    const { closed } = await closeExpired.invoke();
    expect(closed).toBe(0);
  });
});
