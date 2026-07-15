import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
import { ConvertFosterToAdoptionUseCase } from "src/hb-backend-api/foster/domain/ports/in/convert-foster-to-adoption.use-case";

/**
 * End-to-end 후처리 slice: an active foster converts to adoption — the foster
 * ends (CONVERTED_TO_ADOPTION), the animal becomes ADOPTED, and an APPROVED
 * adoption is recorded for the fosterer — all atomically. Non-staff / inactive
 * fosters are refused.
 */
describe("Foster to adopt (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let convert: ConvertFosterToAdoptionUseCase;
  let userModel: Model<UserEntity>;
  let animalModel: Model<AnimalEntity>;
  let fosterModel: Model<FosterApplicationEntity>;
  let adoptionModel: Model<AdoptionApplicationEntity>;

  let shelterId: Types.ObjectId;
  let staffId: string;

  let seq = 0;
  const seedUser = async (shelterRoles: object[] = []): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `u-${seq}`,
      realNameEnc: "enc",
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `u-${id.toHexString()}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles,
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id.toHexString();
  };

  const seedAnimal = async (status: AnimalStatus): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await animalModel.create({
      _id: id,
      shelterId,
      name: `초코-${seq}`,
      species: AnimalSpecies.DOG,
      traits: { sex: AnimalSex.MALE, size: AnimalSize.MEDIUM },
      health: { neutered: true, vaccinated: true },
      intake: { intakeDate: new Date("2026-06-01T00:00:00Z") },
      status,
      version: 0,
    });
    return id.toHexString();
  };

  const seedFoster = async (
    animalId: string,
    applicantId: string,
    status: FosterApplicationStatus,
    endedAt: Date | null = null,
  ): Promise<string> => {
    const id = new Types.ObjectId();
    await fosterModel.create({
      _id: id,
      animalId: new Types.ObjectId(animalId),
      shelterId,
      applicantId: new Types.ObjectId(applicantId),
      questionnaireVersion: 1,
      answers: [],
      plannedEndDate: null,
      status,
      endedAt,
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

    convert = app.get(DIToken.FosterModule.ConvertFosterToAdoptionUseCase);
    userModel = app.get(getModelToken(UserEntity.name));
    animalModel = app.get(getModelToken(AnimalEntity.name));
    fosterModel = app.get(getModelToken(FosterApplicationEntity.name));
    adoptionModel = app.get(getModelToken(AdoptionApplicationEntity.name));

    shelterId = new Types.ObjectId();
    staffId = await seedUser([{ shelterId, role: UserRole.SHELTER_ADMIN }]);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("converts an active foster: foster ends, animal ADOPTED, adoption recorded", async () => {
    const fosterer = await seedUser();
    const animalId = await seedAnimal(AnimalStatus.FOSTERED);
    const fosterId = await seedFoster(
      animalId,
      fosterer,
      FosterApplicationStatus.APPROVED,
    );

    const { adoptionId } = await convert.invoke({
      fosterApplicationId: fosterId,
      actorId: staffId,
    });

    const foster = await fosterModel.findById(fosterId).lean().exec();
    expect(foster?.endReason).toBe(FosterEndReason.CONVERTED_TO_ADOPTION);
    expect(foster?.endedAt).toBeInstanceOf(Date);

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.ADOPTED);

    const adoption = await adoptionModel.findById(adoptionId).lean().exec();
    expect(adoption?.status).toBe(AdoptionApplicationStatus.APPROVED);
    expect(String(adoption?.applicantId)).toBe(fosterer);
    expect(String(adoption?.animalId)).toBe(animalId);
  });

  it("refuses a non-staff outsider to convert", async () => {
    const fosterer = await seedUser();
    const animalId = await seedAnimal(AnimalStatus.FOSTERED);
    const fosterId = await seedFoster(
      animalId,
      fosterer,
      FosterApplicationStatus.APPROVED,
    );

    await expect(
      convert.invoke({ fosterApplicationId: fosterId, actorId: fosterer }),
    ).rejects.toThrow("담당자");
  });

  it("refuses to convert a foster that is not active", async () => {
    const fosterer = await seedUser();
    const animalId = await seedAnimal(AnimalStatus.AVAILABLE);
    const fosterId = await seedFoster(
      animalId,
      fosterer,
      FosterApplicationStatus.APPROVED,
      new Date(), // already ended
    );

    await expect(
      convert.invoke({ fosterApplicationId: fosterId, actorId: staffId }),
    ).rejects.toThrow("진행 중인");
  });
});
