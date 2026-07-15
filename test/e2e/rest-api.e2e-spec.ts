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
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `bom-${id.toHexString()}@example.com`,
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

  let bizSeq = 0;
  const uniqueBiz = (): string => String(1000000000 + ++bizSeq);

  const registerShelterBody = (slug: string) => ({
    name: "행복한 발자국",
    slug,
    address: {
      region: "서울",
      city: "강남구",
      roadAddress: "테헤란로 1",
      visibility: AddressVisibility.PARTIAL,
    },
    businessNumber: uniqueBiz(),
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
      .expect(204);

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

  const registerAndApproveShelter = async (
    token: string,
    slug: string,
    address?: Record<string, unknown>,
  ): Promise<string> => {
    const reg = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters`)
      .set(auth(token))
      .send({
        name: "행복한 발자국",
        slug,
        address: address ?? {
          region: "서울",
          city: "강남구",
          roadAddress: "테헤란로 1",
          visibility: AddressVisibility.PARTIAL,
        },
        businessNumber: uniqueBiz(),
      })
      .expect(201);
    const { shelterId, approvalId } = reg.body.items;
    await request(app.getHttpServer())
      .post(`${PREFIX}/approvals/${approvalId}/decision`)
      .set(auth(token))
      .send({ decision: "APPROVE", metadata: { trustTier: "A" } })
      .expect(204);
    return shelterId as string;
  };

  it("searches animals by keyword, respecting filters", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `disc-${Date.now()}`,
    );
    const uniqueName = `초코-${Date.now()}`;
    await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send({
        name: uniqueName,
        species: AnimalSpecies.DOG,
        traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(201);

    const hit = await request(app.getHttpServer())
      .get(`${PREFIX}/animals`)
      .query({ keyword: uniqueName, limit: 10 })
      .set(auth(admin.token))
      .expect(200);
    expect(hit.body.items.items).toHaveLength(1);
    expect(hit.body.items.items[0].name).toBe(uniqueName);
    expect(hit.body.items.hasNext).toBe(false);

    // a mismatching species filter returns nothing
    const miss = await request(app.getHttpServer())
      .get(`${PREFIX}/animals`)
      .query({ keyword: uniqueName, species: AnimalSpecies.CAT })
      .set(auth(admin.token))
      .expect(200);
    expect(miss.body.items.items).toHaveLength(0);
  });

  it("returns animal detail with weight and the owning-shelter summary", async () => {
    const admin = await seedUser();
    const slug = `detail-${Date.now()}`;
    const shelterId = await registerAndApproveShelter(admin.token, slug);

    const reg = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send({
        name: `보리-${Date.now()}`,
        species: AnimalSpecies.DOG,
        traits: {
          sex: AnimalSex.MALE,
          size: AnimalSize.SMALL,
          weightKg: 4.2,
        },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(201);
    const { animalId } = reg.body.items;

    const detail = await request(app.getHttpServer())
      .get(`${PREFIX}/animals/${animalId}`)
      .set(auth(admin.token))
      .expect(200);

    expect(detail.body.items.traits.weightKg).toBe(4.2);
    expect(detail.body.items.shelter).toMatchObject({
      slug,
      name: "행복한 발자국",
      region: "서울",
      city: "강남구",
    });
  });

  it("exposes the About profile on GET /shelters/:slug and stats on /stats", async () => {
    const admin = await seedUser();
    const slug = `about-${Date.now()}`;
    const shelterId = await registerAndApproveShelter(admin.token, slug);

    // Profile is written by the §07 About editor (PATCH), not raw DB seeding.
    await request(app.getHttpServer())
      .patch(`${PREFIX}/shelters/${shelterId}/profile`)
      .set(auth(admin.token))
      .send({
        intro: "# 안녕하세요\n행복한 발자국입니다.",
        operatingSince: "2015-03-01T00:00:00.000Z",
        representativeName: "김보호",
      })
      .expect(204);

    const about = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${slug}`)
      .set(auth(admin.token))
      .expect(200);
    expect(about.body.items.intro).toContain("행복한 발자국");
    expect(about.body.items.operatingSince).toBe("2015-03-01T00:00:00.000Z");
    expect(about.body.items.representativeName).toBe("김보호");
    expect(about.body.items.visitGuide).toBeNull();

    // Two AVAILABLE animals → shelteredCount 2, availableCount 2, adoptedCount 0.
    for (const name of [`s1-${Date.now()}`, `s2-${Date.now()}`]) {
      await request(app.getHttpServer())
        .post(`${PREFIX}/shelters/${shelterId}/animals`)
        .set(auth(admin.token))
        .send({
          name,
          species: AnimalSpecies.CAT,
          traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
          health: { neutered: true, vaccinated: true },
          intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
        })
        .expect(201);
    }

    const stats = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${shelterId}/stats`)
      .set(auth(admin.token))
      .expect(200);
    expect(stats.body.items).toEqual({
      adoptedCount: 0,
      shelteredCount: 2,
      availableCount: 2,
    });
  });

  it("saves a cover image via PATCH, surfaces it on the directory card, and refuses non-staff", async () => {
    const admin = await seedUser();
    const region = `cover-${Date.now()}`;
    const slug = `cover-${Date.now()}`;
    const shelterId = await registerAndApproveShelter(admin.token, slug, {
      region,
      city: "강남구",
      roadAddress: "테헤란로 5",
      visibility: AddressVisibility.PARTIAL,
    });

    // A non-staff member cannot edit the profile.
    const outsider = await seedUser();
    await request(app.getHttpServer())
      .patch(`${PREFIX}/shelters/${shelterId}/profile`)
      .set(auth(outsider.token))
      .send({ coverImageKey: "shelters/nope.webp" })
      .expect(403);

    // The shelter's admin sets the cover image.
    await request(app.getHttpServer())
      .patch(`${PREFIX}/shelters/${shelterId}/profile`)
      .set(auth(admin.token))
      .send({ coverImageKey: "shelters/hero.webp" })
      .expect(204);

    // It now rides along on the §04 directory card.
    const list = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters`)
      .query({ region, limit: 10 })
      .set(auth(admin.token))
      .expect(200);
    expect(list.body.items.items).toHaveLength(1);
    expect(list.body.items.items[0].coverImageKey).toBe("shelters/hero.webp");
  });

  it("lists verified shelters in the directory, filtered by region", async () => {
    const admin = await seedUser();
    const region = `dir-${Date.now()}`;
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `dir-list-${Date.now()}`,
      {
        region,
        city: "강남구",
        roadAddress: "테헤란로 9",
        visibility: AddressVisibility.PARTIAL,
      },
    );

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters`)
      .query({ region, limit: 10 })
      .set(auth(admin.token))
      .expect(200);

    expect(res.body.items.items).toHaveLength(1);
    expect(res.body.items.items[0].id).toBe(shelterId);
    expect(res.body.items.items[0].region).toBe(region);
    expect(res.body.items.items[0].status).toBe("VERIFIED");
    expect(res.body.items.hasNext).toBe(false);
    expect(res.body.items.nextCursor).toBeNull();
  });

  it("returns map markers only for shelters with disclosed coordinates", async () => {
    const admin = await seedUser();
    const slug = `map-${Date.now()}`;
    await registerAndApproveShelter(admin.token, slug, {
      region: "부산",
      city: "해운대구",
      roadAddress: "센텀로 1",
      lat: 35.16,
      lng: 129.16,
      visibility: AddressVisibility.FULL,
    });

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/map`)
      .query({ region: "부산" })
      .set(auth(admin.token))
      .expect(200);
    const marker = (res.body.items as { slug: string; lat: number }[]).find(
      (m) => m.slug === slug,
    );
    expect(marker).toBeDefined();
    expect(marker?.lat).toBe(35.16);
  });
});
