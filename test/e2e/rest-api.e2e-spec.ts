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
  const seedUser = async (): Promise<{
    id: string;
    token: string;
    nickname: string;
  }> => {
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
    return { id: id.toHexString(), token, nickname };
  };

  // A platform operator (SYSTEM_ADMIN) — the decider for SHELTER_VERIFICATION.
  // Role is fresh-loaded by the services, so patching the seeded doc suffices.
  const seedOperator = async (): Promise<{ id: string; token: string }> => {
    const operator = await seedUser();
    await userModel
      .updateOne(
        { _id: new Types.ObjectId(operator.id) },
        { $set: { roles: [UserRole.USER, UserRole.SYSTEM_ADMIN] } },
      )
      .exec();
    return operator;
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

    // 2) operator (not the registrant) approves the verification
    const operator = await seedOperator();
    await request(app.getHttpServer())
      .post(`${PREFIX}/approvals/${approvalId}/decision`)
      .set(auth(operator.token))
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

  it("forbids a non-operator from approving their own shelter verification (403)", async () => {
    const registrant = await seedUser();
    const registerRes = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters`)
      .set(auth(registrant.token))
      .send(registerShelterBody(`selfapprove-${Date.now()}`))
      .expect(201);
    const { approvalId } = registerRes.body.items;

    // The registrant is a plain USER — deciding their own verification (which
    // would self-grant SHELTER_ADMIN) must be rejected, not silently allowed.
    await request(app.getHttpServer())
      .post(`${PREFIX}/approvals/${approvalId}/decision`)
      .set(auth(registrant.token))
      .send({ decision: "APPROVE", metadata: { trustTier: "A" } })
      .expect(403);
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
    const operator = await seedOperator();
    await request(app.getHttpServer())
      .post(`${PREFIX}/approvals/${approvalId}/decision`)
      .set(auth(operator.token))
      .send({ decision: "APPROVE", metadata: { trustTier: "A" } })
      .expect(204);
    return shelterId as string;
  };

  it("opens the shelter directory/detail/map to anonymous visitors, but keeps the roster private", async () => {
    const admin = await seedUser();
    const slug = `public-${Date.now()}`;
    const shelterId = await registerAndApproveShelter(admin.token, slug);
    const server = app.getHttpServer();

    // Directory list — no Authorization header.
    const list = await request(server).get(`${PREFIX}/shelters`).expect(200);
    expect(
      list.body.items.items.some((s: { slug: string }) => s.slug === slug),
    ).toBe(true);

    // About detail by slug — anonymous.
    const detail = await request(server)
      .get(`${PREFIX}/shelters/${slug}`)
      .expect(200);
    expect(detail.body.items.status).toBe(ShelterStatus.VERIFIED);

    // Map markers — anonymous.
    await request(server).get(`${PREFIX}/shelters/map`).expect(200);

    // A non-@Public read on the same controller still requires a token.
    await request(server)
      .get(`${PREFIX}/shelters/${shelterId}/staff`)
      .expect(401);
  });

  it("exposes the operator pending-approval queue with per-type counts, operator-only", async () => {
    const server = app.getHttpServer();
    const applicant = await seedUser();

    // Grant one seeded user the operator role (fresh-loaded by the services).
    const op = await seedUser();
    await userModel
      .updateOne(
        { _id: new Types.ObjectId(op.id) },
        { $set: { roles: [UserRole.USER, UserRole.SYSTEM_ADMIN] } },
      )
      .exec();

    // A fresh shelter registration opens a PENDING SHELTER_VERIFICATION.
    const reg = await request(server)
      .post(`${PREFIX}/shelters`)
      .set(auth(applicant.token))
      .send(registerShelterBody(`opq-${Date.now()}`))
      .expect(201);
    const { approvalId } = reg.body.items;

    // Operator sees it in the type-filtered queue.
    const queue = await request(server)
      .get(`${PREFIX}/approvals/pending`)
      .query({ type: "SHELTER_VERIFICATION", limit: 50 })
      .set(auth(op.token))
      .expect(200);
    const mine = queue.body.items.items.find(
      (a: { approvalId: string }) => a.approvalId === approvalId,
    );
    expect(mine).toBeDefined();
    expect(mine.type).toBe("SHELTER_VERIFICATION");

    // Tab badges: verification count reflects the real aggregation.
    const counts = await request(server)
      .get(`${PREFIX}/approvals/pending/counts`)
      .set(auth(op.token))
      .expect(200);
    expect(counts.body.items.SHELTER_VERIFICATION).toBeGreaterThanOrEqual(1);

    // A non-operator is forbidden.
    await request(server)
      .get(`${PREFIX}/approvals/pending`)
      .set(auth(applicant.token))
      .expect(403);
  });

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

  it("distinguishes adoption/foster eligibility in detail, catalog filter, and the apply guard", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `plc-${Date.now()}`,
    );
    const fosterName = `임보온리-${Date.now()}`;
    const body = (name: string, eligiblePlacements?: string[]) => ({
      name,
      species: AnimalSpecies.DOG,
      traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
      health: { neutered: true, vaccinated: true },
      intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      ...(eligiblePlacements ? { eligiblePlacements } : {}),
    });

    // A foster-only animal.
    const reg = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send(body(fosterName, ["FOSTER"]))
      .expect(201);
    const { animalId } = reg.body.items;

    // Detail exposes the eligibility.
    const detail = await request(app.getHttpServer())
      .get(`${PREFIX}/animals/${animalId}`)
      .set(auth(admin.token))
      .expect(200);
    expect(detail.body.items.eligiblePlacements).toEqual(["FOSTER"]);

    // Catalog filter: FOSTER finds it, ADOPTION excludes it.
    const inFoster = await request(app.getHttpServer())
      .get(`${PREFIX}/animals`)
      .query({ keyword: fosterName, placement: "FOSTER" })
      .set(auth(admin.token))
      .expect(200);
    expect(inFoster.body.items.items).toHaveLength(1);
    expect(inFoster.body.items.items[0].id).toBe(animalId);

    const inAdoption = await request(app.getHttpServer())
      .get(`${PREFIX}/animals`)
      .query({ keyword: fosterName, placement: "ADOPTION" })
      .set(auth(admin.token))
      .expect(200);
    expect(inAdoption.body.items.items).toHaveLength(0);

    // Apply guard: an adoption application on a foster-only animal is rejected.
    const applicant = await seedUser();
    await request(app.getHttpServer())
      .post(`${PREFIX}/animals/${animalId}/adoption-applications`)
      .set(auth(applicant.token))
      .send({ answers: [] })
      .expect(409);

    // Registering without the field defaults to accepting both.
    const both = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send(body(`둘다-${Date.now()}`))
      .expect(201);
    const bothDetail = await request(app.getHttpServer())
      .get(`${PREFIX}/animals/${both.body.items.animalId}`)
      .set(auth(admin.token))
      .expect(200);
    expect(bothDetail.body.items.eligiblePlacements).toEqual([
      "ADOPTION",
      "FOSTER",
    ]);
  });

  it("lets shelter staff decide an adoption application by application id", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `decide-${Date.now()}`,
    );
    const animalBody = {
      name: `결정-${Date.now()}`,
      species: AnimalSpecies.DOG,
      traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
      health: { neutered: true, vaccinated: true },
      intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
    };
    const registerAnimal = async (): Promise<string> => {
      const res = await request(app.getHttpServer())
        .post(`${PREFIX}/shelters/${shelterId}/animals`)
        .set(auth(admin.token))
        .send(animalBody)
        .expect(201);
      return res.body.items.animalId as string;
    };
    const submitApplication = async (animalId: string): Promise<string> => {
      const applicant = await seedUser();
      const res = await request(app.getHttpServer())
        .post(`${PREFIX}/animals/${animalId}/adoption-applications`)
        .set(auth(applicant.token))
        .send({ answers: [] })
        .expect(201);
      return res.body.items.applicationId as string;
    };

    // Approve: application → APPROVED, animal → ADOPTED.
    const animalId = await registerAnimal();
    const applicationId = await submitApplication(animalId);
    await request(app.getHttpServer())
      .post(`${PREFIX}/adoption-applications/${applicationId}/decision`)
      .set(auth(admin.token))
      .send({ decision: "APPROVE" })
      .expect(204);

    const detail = await request(app.getHttpServer())
      .get(`${PREFIX}/adoption-applications/${applicationId}`)
      .set(auth(admin.token))
      .expect(200);
    expect(detail.body.items.status).toBe("APPROVED");

    const animal = await request(app.getHttpServer())
      .get(`${PREFIX}/animals/${animalId}`)
      .set(auth(admin.token))
      .expect(200);
    expect(animal.body.items.status).toBe(AnimalStatus.ADOPTED);

    // Deciding again → no pending approval → 404.
    await request(app.getHttpServer())
      .post(`${PREFIX}/adoption-applications/${applicationId}/decision`)
      .set(auth(admin.token))
      .send({ decision: "APPROVE" })
      .expect(404);

    // A non-staff user cannot decide a fresh application → 403.
    const animalId2 = await registerAnimal();
    const applicationId2 = await submitApplication(animalId2);
    const outsider = await seedUser();
    await request(app.getHttpServer())
      .post(`${PREFIX}/adoption-applications/${applicationId2}/decision`)
      .set(auth(outsider.token))
      .send({ decision: "REJECT", reason: "권한 없음 테스트" })
      .expect(403);
  });

  it("records an in-app notification for the applicant on adoption approval", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `notif-${Date.now()}`,
    );
    const animalRes = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send({
        name: `알림-${Date.now()}`,
        species: AnimalSpecies.DOG,
        traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(201);
    const { animalId } = animalRes.body.items;

    const applicant = await seedUser();
    const submitted = await request(app.getHttpServer())
      .post(`${PREFIX}/animals/${animalId}/adoption-applications`)
      .set(auth(applicant.token))
      .send({ answers: [] })
      .expect(201);
    const { applicationId } = submitted.body.items;

    // Before the decision, the applicant has no notifications.
    const before = await request(app.getHttpServer())
      .get(`${PREFIX}/me/notifications/unread-count`)
      .set(auth(applicant.token))
      .expect(200);
    expect(before.body.items.count).toBe(0);

    // The shelter approves — a notification is recorded atomically.
    await request(app.getHttpServer())
      .post(`${PREFIX}/adoption-applications/${applicationId}/decision`)
      .set(auth(admin.token))
      .send({ decision: "APPROVE" })
      .expect(204);

    const feed = await request(app.getHttpServer())
      .get(`${PREFIX}/me/notifications`)
      .set(auth(applicant.token))
      .expect(200);
    const mine = feed.body.items.items;
    expect(mine).toHaveLength(1);
    expect(mine[0].type).toBe("ADOPTION_APPROVED");
    expect(mine[0].subjectRef).toBe(applicationId);
    expect(mine[0].read).toBe(false);
    const notificationId = mine[0].id;

    const unread = await request(app.getHttpServer())
      .get(`${PREFIX}/me/notifications/unread-count`)
      .set(auth(applicant.token))
      .expect(200);
    expect(unread.body.items.count).toBe(1);

    // Another user cannot mark this notification read.
    const outsider = await seedUser();
    await request(app.getHttpServer())
      .patch(`${PREFIX}/me/notifications/${notificationId}/read`)
      .set(auth(outsider.token))
      .expect(403);

    // The owner marks it read → unread count drops to 0.
    await request(app.getHttpServer())
      .patch(`${PREFIX}/me/notifications/${notificationId}/read`)
      .set(auth(applicant.token))
      .expect(204);
    const after = await request(app.getHttpServer())
      .get(`${PREFIX}/me/notifications/unread-count`)
      .set(auth(applicant.token))
      .expect(200);
    expect(after.body.items.count).toBe(0);
  });

  const notificationsOf = async (
    token: string,
  ): Promise<{ type: string; subjectRef: string }[]> => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/me/notifications`)
      .query({ limit: 50 })
      .set(auth(token))
      .expect(200);
    return res.body.items.items;
  };

  it("alerts the shelter on a new application and the applicant on rejection", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `notif2-${Date.now()}`,
    );
    const animalRes = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send({
        name: `알림2-${Date.now()}`,
        species: AnimalSpecies.DOG,
        traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(201);
    const { animalId } = animalRes.body.items;

    const applicant = await seedUser();
    const submitted = await request(app.getHttpServer())
      .post(`${PREFIX}/animals/${animalId}/adoption-applications`)
      .set(auth(applicant.token))
      .send({ answers: [] })
      .expect(201);
    const { applicationId } = submitted.body.items;

    // The shelter admin (representative) is alerted to the new application.
    const adminFeed = await notificationsOf(admin.token);
    expect(
      adminFeed.some(
        (n) =>
          n.type === "NEW_ADOPTION_APPLICATION" &&
          n.subjectRef === applicationId,
      ),
    ).toBe(true);

    // Rejection notifies the applicant (previously silent).
    await request(app.getHttpServer())
      .post(`${PREFIX}/adoption-applications/${applicationId}/decision`)
      .set(auth(admin.token))
      .send({ decision: "REJECT", reason: "조건 불충족" })
      .expect(204);
    const applicantFeed = await notificationsOf(applicant.token);
    expect(
      applicantFeed.some(
        (n) => n.type === "ADOPTION_REJECTED" && n.subjectRef === applicationId,
      ),
    ).toBe(true);
  });

  it("alerts the shelter on a new inquiry and the inquirer on a reply", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `notif3-${Date.now()}`,
    );
    const animalRes = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send({
        name: `알림3-${Date.now()}`,
        species: AnimalSpecies.DOG,
        traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(201);
    const { animalId } = animalRes.body.items;

    const inquirer = await seedUser();
    const opened = await request(app.getHttpServer())
      .post(`${PREFIX}/animals/${animalId}/inquiries`)
      .set(auth(inquirer.token))
      .send({ message: "문의드려요" })
      .expect(201);
    const { inquiryId } = opened.body.items;

    // The shelter admin is alerted to the new inquiry.
    const adminFeed = await notificationsOf(admin.token);
    expect(
      adminFeed.some(
        (n) => n.type === "NEW_INQUIRY" && n.subjectRef === inquiryId,
      ),
    ).toBe(true);

    // The shelter replies → the inquirer is notified of the message.
    await request(app.getHttpServer())
      .post(`${PREFIX}/conversations/INQUIRY/${inquiryId}/messages`)
      .set(auth(admin.token))
      .send({ body: "안녕하세요, 답변드려요" })
      .expect(201);
    const inquirerFeed = await notificationsOf(inquirer.token);
    expect(
      inquirerFeed.some(
        (n) => n.type === "NEW_MESSAGE" && n.subjectRef === inquiryId,
      ),
    ).toBe(true);
  });

  it("exposes a shelter's verification dossier to an operator, not to others", async () => {
    const registrant = await seedUser();
    const reg = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters`)
      .set(auth(registrant.token))
      .send(registerShelterBody(`dossier-${Date.now()}`))
      .expect(201);
    const { shelterId } = reg.body.items;

    const operator = await seedOperator();
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${shelterId}/verification`)
      .set(auth(operator.token))
      .expect(200);
    const d = res.body.items;
    expect(d.shelterId).toBe(shelterId);
    expect(d.status).toBe(ShelterStatus.PENDING_VERIFICATION);
    expect(d.name).toBe("행복한 발자국");
    expect(d.businessNumber).toBeTruthy();
    expect(d.address.region).toBe("서울");
    expect(d.registrant.id).toBe(registrant.id);
    expect(Array.isArray(d.verificationSignals)).toBe(true);
    expect(d.verificationSignals).toHaveLength(3);

    // The registrant (a plain USER) cannot read the dossier.
    await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${shelterId}/verification`)
      .set(auth(registrant.token))
      .expect(403);
  });

  it("removes a shelter staff member (admin only) and drops them from the roster", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `staffrm-${Date.now()}`,
    );

    // Seed a member and grant them SHELTER_STAFF at this shelter.
    const staff = await seedUser();
    await userModel
      .updateOne(
        { _id: new Types.ObjectId(staff.id) },
        {
          $set: {
            shelterRoles: [
              {
                shelterId: new Types.ObjectId(shelterId),
                role: UserRole.SHELTER_STAFF,
              },
            ],
          },
        },
      )
      .exec();

    const rosterHas = async (id: string): Promise<boolean> => {
      const res = await request(app.getHttpServer())
        .get(`${PREFIX}/shelters/${shelterId}/staff`)
        .set(auth(admin.token))
        .expect(200);
      return res.body.items.some((m: { id: string }) => m.id === id);
    };

    expect(await rosterHas(staff.id)).toBe(true);

    // A non-admin cannot remove staff.
    const outsider = await seedUser();
    await request(app.getHttpServer())
      .delete(`${PREFIX}/shelters/${shelterId}/staff/${staff.id}`)
      .set(auth(outsider.token))
      .expect(403);

    // The admin removes them → gone from the roster.
    await request(app.getHttpServer())
      .delete(`${PREFIX}/shelters/${shelterId}/staff/${staff.id}`)
      .set(auth(admin.token))
      .expect(204);
    expect(await rosterHas(staff.id)).toBe(false);

    // Removing again → 404 (no longer a staff member).
    await request(app.getHttpServer())
      .delete(`${PREFIX}/shelters/${shelterId}/staff/${staff.id}`)
      .set(auth(admin.token))
      .expect(404);
  });

  it("opens a shelter inquiry from an animal and threads it through messaging", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `inquiry-${Date.now()}`,
    );
    const animalName = `문의-${Date.now()}`;
    const animalRes = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters/${shelterId}/animals`)
      .set(auth(admin.token))
      .send({
        name: animalName,
        species: AnimalSpecies.DOG,
        traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
        health: { neutered: true, vaccinated: true },
        intake: { intakeDate: "2026-01-02T00:00:00.000Z" },
      })
      .expect(201);
    const { animalId } = animalRes.body.items;

    // A member opens an inquiry with the first message.
    const inquirer = await seedUser();
    const opened = await request(app.getHttpServer())
      .post(`${PREFIX}/animals/${animalId}/inquiries`)
      .set(auth(inquirer.token))
      .send({ message: "이 아이 입양 조건이 궁금해요" })
      .expect(201);
    const { inquiryId } = opened.body.items;
    expect(inquiryId).toBeTruthy();

    // The first message is threaded through the shared messaging domain.
    const messages = await request(app.getHttpServer())
      .get(`${PREFIX}/conversations/INQUIRY/${inquiryId}/messages`)
      .set(auth(inquirer.token))
      .expect(200);
    expect(messages.body.items).toHaveLength(1);
    expect(messages.body.items[0].body).toBe("이 아이 입양 조건이 궁금해요");

    // A repeat inquiry on the same animal reuses the same thread.
    const again = await request(app.getHttpServer())
      .post(`${PREFIX}/animals/${animalId}/inquiries`)
      .set(auth(inquirer.token))
      .send({ message: "한 번 더 여쭤봐요" })
      .expect(201);
    expect(again.body.items.inquiryId).toBe(inquiryId);

    // The inquirer sees it in their list, enriched with the shelter name, the
    // animal name, and a preview of the last message they sent.
    const mine = await request(app.getHttpServer())
      .get(`${PREFIX}/me/inquiries`)
      .set(auth(inquirer.token))
      .expect(200);
    const myRow = mine.body.items.items.find(
      (i: { inquiryId: string }) => i.inquiryId === inquiryId,
    );
    expect(myRow).toBeDefined();
    expect(myRow.animalName).toBe(animalName);
    expect(myRow.counterpartName).toBeTruthy();
    expect(myRow.lastMessage).toMatchObject({
      body: "한 번 더 여쭤봐요",
      senderRole: "APPLICANT",
    });

    // The shelter sees it in its inbox, enriched with the inquirer's nickname.
    const inbox = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${shelterId}/inquiries`)
      .set(auth(admin.token))
      .expect(200);
    const inboxRow = inbox.body.items.items.find(
      (i: { inquiryId: string }) => i.inquiryId === inquiryId,
    );
    expect(inboxRow).toBeDefined();
    expect(inboxRow.animalId).toBe(animalId);
    expect(inboxRow.animalName).toBe(animalName);
    expect(inboxRow.counterpartName).toBe(inquirer.nickname);
    expect(inboxRow.lastMessage.body).toBe("한 번 더 여쭤봐요");

    // A non-staff outsider cannot read the shelter's inbox.
    const outsider = await seedUser();
    await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${shelterId}/inquiries`)
      .set(auth(outsider.token))
      .expect(403);
  });

  it("reads back a shelter's About profile for its staff, not for others", async () => {
    const admin = await seedUser();
    const shelterId = await registerAndApproveShelter(
      admin.token,
      `profile-${Date.now()}`,
    );

    // Edit the profile, then read it back for prefill.
    await request(app.getHttpServer())
      .patch(`${PREFIX}/shelters/${shelterId}/profile`)
      .set(auth(admin.token))
      .send({ intro: "우리 보호소 소개", representativeName: "김보호" })
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${shelterId}/profile`)
      .set(auth(admin.token))
      .expect(200);
    const p = res.body.items;
    expect(p.shelterId).toBe(shelterId);
    expect(p.intro).toBe("우리 보호소 소개");
    expect(p.representativeName).toBe("김보호");
    expect(p.visitGuide).toBeNull();

    // A non-staff user cannot read the shelter's profile.
    const outsider = await seedUser();
    await request(app.getHttpServer())
      .get(`${PREFIX}/shelters/${shelterId}/profile`)
      .set(auth(outsider.token))
      .expect(403);
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
