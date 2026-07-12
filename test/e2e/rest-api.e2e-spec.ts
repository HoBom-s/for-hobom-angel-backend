import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import request from "supertest";
import { ResponseWrapInterceptor } from "src/shared/response/response-wrap.interceptor";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

const PREFIX = "/hobom-angel-backend/api/v1";

/**
 * REST layer e2e: drives real HTTP through the guard, DTO validation, response
 * envelope, and a cross-domain flow (register shelter → operator approves →
 * verified admin lists an animal). Access tokens are minted directly (login /
 * 본인확인 is a separate, deferred concern).
 */
describe("REST API (e2e)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let jwt: JwtService;
  let userModel: Model<UserEntity>;

  let seq = 0;
  const seedUser = async (): Promise<{ id: string; token: string }> => {
    const id = new Types.ObjectId();
    seq += 1;
    const nickname = `bom-${seq}`;
    await userModel.create({
      _id: id,
      nickname,
      realNameEnc: "enc",
      ci: `ci-${id.toHexString()}`,
      phoneEnc: "enc",
      email: "bom@example.com",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    const token = jwt.sign({ sub: nickname, uid: id.toHexString() });
    return { id: id.toHexString(), token };
  };

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const registerShelterBody = (slug: string) => ({
    name: "행복한 발자국",
    slug,
    address: {
      region: "서울",
      city: "강남구",
      roadAddress: "테헤란로 1",
      visibility: AddressVisibility.PARTIAL,
    },
    businessNumber: "1234567890",
  });

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
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseWrapInterceptor());
    await app.init();

    jwt = app.get(JwtService);
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("rejects an unauthenticated request with 401", async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/shelters`)
      .send(registerShelterBody("no-auth"))
      .expect(401);
  });

  it("rejects an invalid body with 400", async () => {
    const { token } = await seedUser();
    await request(app.getHttpServer())
      .post(`${PREFIX}/shelters`)
      .set(auth(token))
      .send({ name: "", slug: "x" }) // empty name, too-short slug, no org proof
      .expect(400);
  });

  it("registers a shelter, approves it, and lets the new admin list an animal", async () => {
    const registrant = await seedUser();
    const slug = `happy-${Date.now()}`;

    // 1) register shelter (envelope: { success, items })
    const registerRes = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters`)
      .set(auth(registrant.token))
      .send(registerShelterBody(slug))
      .expect(201);
    expect(registerRes.body.success).toBe(true);
    const { shelterId, approvalId } = registerRes.body.items;
    expect(shelterId).toBeTruthy();

    // 2) operator approves the verification
    await request(app.getHttpServer())
      .post(`${PREFIX}/approvals/${approvalId}/decision`)
      .set(auth(registrant.token))
      .send({ decision: "APPROVE", metadata: { trustTier: "A" } })
      .expect(201);

    // shelter is now VERIFIED
    const shelterRes = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${slug}`)
      .set(auth(registrant.token))
      .expect(200);
    expect(shelterRes.body.items.status).toBe(ShelterStatus.VERIFIED);

    // 3) the registrant (now SHELTER_ADMIN) registers an animal
    const animalRes = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(registrant.token))
      .send({
        name: "초코",
        species: AnimalSpecies.DOG,
        traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(201);
    const { animalId } = animalRes.body.items;

    // 4) read it back
    const getAnimal = await request(app.getHttpServer())
      .get(`${PREFIX}/animals/${animalId}`)
      .set(auth(registrant.token))
      .expect(200);
    expect(getAnimal.body.items.status).toBe(AnimalStatus.AVAILABLE);
    expect(getAnimal.body.items.name).toBe("초코");
  });

  it("forbids registering an animal under a shelter the user can't manage", async () => {
    const outsider = await seedUser();
    await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${new Types.ObjectId().toHexString()}/animals`)
      .set(auth(outsider.token))
      .send({
        name: "초코",
        species: AnimalSpecies.DOG,
        traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(404); // shelter doesn't exist
  });
});
