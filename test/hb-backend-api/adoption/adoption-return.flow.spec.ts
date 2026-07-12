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
import { ReturnAdoptionUseCase } from "src/hb-backend-api/adoption/domain/ports/in/return-adoption.use-case";
import { RelistAnimalUseCase } from "src/hb-backend-api/animal/domain/ports/in/relist-animal.use-case";

/**
 * End-to-end 후처리 slice: an approved adoption is returned (파양) — the
 * application -> RETURNED and the animal -> RETURNED atomically — then the
 * shelter re-lists the animal back to AVAILABLE. Non-staff are refused.
 */
describe("Adoption return + relist (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let returnAdoption: ReturnAdoptionUseCase;
  let relistAnimal: RelistAnimalUseCase;
  let userModel: Model<UserEntity>;
  let animalModel: Model<AnimalEntity>;
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

  const seedAdoption = async (
    animalId: string,
    applicantId: string,
    status: AdoptionApplicationStatus,
  ): Promise<string> => {
    const id = new Types.ObjectId();
    await adoptionModel.create({
      _id: id,
      animalId: new Types.ObjectId(animalId),
      shelterId,
      applicantId: new Types.ObjectId(applicantId),
      questionnaireVersion: 1,
      answers: [],
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

    returnAdoption = app.get(DIToken.AdoptionModule.ReturnAdoptionUseCase);
    relistAnimal = app.get(DIToken.AnimalModule.RelistAnimalUseCase);
    userModel = app.get(getModelToken(UserEntity.name));
    animalModel = app.get(getModelToken(AnimalEntity.name));
    adoptionModel = app.get(getModelToken(AdoptionApplicationEntity.name));

    shelterId = new Types.ObjectId();
    staffId = await seedUser([{ shelterId, role: UserRole.SHELTER_ADMIN }]);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("returns an approved adoption, transitioning application and animal", async () => {
    const adopter = await seedUser();
    const animalId = await seedAnimal(AnimalStatus.ADOPTED);
    const adoptionId = await seedAdoption(
      animalId,
      adopter,
      AdoptionApplicationStatus.APPROVED,
    );

    await returnAdoption.invoke({
      adoptionId,
      actorId: staffId,
      reason: "이사로 인해 파양",
    });

    const adoption = await adoptionModel.findById(adoptionId).lean().exec();
    expect(adoption?.status).toBe(AdoptionApplicationStatus.RETURNED);
    expect(adoption?.returnReason).toBe("이사로 인해 파양");
    expect(adoption?.returnedAt).toBeInstanceOf(Date);

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.RETURNED);

    // and re-listing reopens it for adoption
    await relistAnimal.invoke({ animalId, actorId: staffId });
    const relisted = await animalModel.findById(animalId).lean().exec();
    expect(relisted?.status).toBe(AnimalStatus.AVAILABLE);
  });

  it("refuses a non-staff outsider to return", async () => {
    const adopter = await seedUser();
    const animalId = await seedAnimal(AnimalStatus.ADOPTED);
    const adoptionId = await seedAdoption(
      animalId,
      adopter,
      AdoptionApplicationStatus.APPROVED,
    );

    await expect(
      returnAdoption.invoke({
        adoptionId,
        actorId: adopter,
        reason: "임의 반환",
      }),
    ).rejects.toThrow("담당자");
  });

  it("refuses returning a not-yet-approved adoption", async () => {
    const adopter = await seedUser();
    const animalId = await seedAnimal(AnimalStatus.RESERVED);
    const adoptionId = await seedAdoption(
      animalId,
      adopter,
      AdoptionApplicationStatus.PENDING,
    );

    await expect(
      returnAdoption.invoke({
        adoptionId,
        actorId: staffId,
        reason: "아직 승인 안 됨",
      }),
    ).rejects.toThrow("완료된 입양");
  });
});
