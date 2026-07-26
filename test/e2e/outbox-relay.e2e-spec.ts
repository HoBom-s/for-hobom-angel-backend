import { join } from "path";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import request from "supertest";
import { ResponseWrapInterceptor } from "src/shared/response/response-wrap.interceptor";
import { buildGrpcOptions } from "src/infra/grpc/options.grpc";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";

const PREFIX = "/hobom-angel-backend/api/v1";
const GRPC_PORT = "50079";
const GRPC_API_KEY = "test-grpc-api-key";

const authMeta = () => {
  const m = new grpc.Metadata();
  m.set("x-api-key", GRPC_API_KEY);
  return m;
};

/**
 * Notification-pipeline e2e (the half this service owns): a real HTTP approval
 * writes a transactional outbox row, and hobom-event-processor's gRPC contract
 * then drains it — find the PENDING row, mark it SENT. The Kafka publish itself
 * is the processor's job and is out of scope here.
 */
describe("Outbox relay (e2e)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let jwt: JwtService;
  let userModel: Model<UserEntity>;
  let outboxModel: Model<OutboxEntity>;
  let findClient: grpc.Client & Record<string, any>;
  let patchClient: grpc.Client & Record<string, any>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  let seq = 0;
  const seedAdmin = async (): Promise<{ id: string; token: string }> => {
    const id = new Types.ObjectId();
    seq += 1;
    const nickname = `relay-${seq}`;
    await userModel.create({
      _id: id,
      nickname,
      realNameEnc: "enc",
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `${id.toHexString()}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER, UserRole.SYSTEM_ADMIN],
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return {
      id: id.toHexString(),
      token: jwt.sign({ sub: nickname, uid: id.toHexString() }),
    };
  };

  const grpcCall = (
    client: Record<string, any>,
    method: string,
    payload: unknown,
    metadata: grpc.Metadata,
  ): Promise<any> =>
    new Promise((resolve, reject) =>
      client[method](
        payload,
        metadata,
        (err: grpc.ServiceError | null, res: unknown) =>
          err ? reject(err) : resolve(res),
      ),
    );

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB = mongo.getUri();
    process.env.NODE_ENV = "test";
    process.env.HOBOM_JWT_SECRET = "test-access-secret";
    process.env.HOBOM_JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.HOBOM_JWT_ACCESS_TOKEN_EXPIRED = "15m";
    process.env.HOBOM_JWT_REFRESH_TOKEN_EXPIRED = "30d";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.HOBOM_GRPC_HOST = "127.0.0.1";
    process.env.HOBOM_GRPC_PORT = GRPC_PORT;
    process.env.HOBOM_GRPC_API_KEY = GRPC_API_KEY;

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

    const grpcOptions = buildGrpcOptions();
    if (!grpcOptions) {
      throw new Error(
        "proto/angel is missing — buildGrpcOptions returned null",
      );
    }
    app.connectMicroservice(grpcOptions);
    await app.init();
    await app.startAllMicroservices();

    jwt = app.get(JwtService);
    userModel = app.get(getModelToken(UserEntity.name));
    outboxModel = app.get(getModelToken(OutboxEntity.name));

    const pkg = grpc.loadPackageDefinition(
      protoLoader.loadSync(
        [
          join(
            process.cwd(),
            "proto/angel/outbox/v1/find-hobom-angel-outbox.proto",
          ),
          join(
            process.cwd(),
            "proto/angel/outbox/v1/patch-hobom-angel-outbox.proto",
          ),
        ],
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      ),
    ) as any;
    const target = `127.0.0.1:${GRPC_PORT}`;
    const creds = grpc.credentials.createInsecure();
    findClient = new pkg.outbox.angel.FindHoBomAngelOutboxController(
      target,
      creds,
    );
    patchClient = new pkg.outbox.angel.PatchHoBomAngelOutboxController(
      target,
      creds,
    );
  }, 60_000);

  afterAll(async () => {
    findClient?.close?.();
    patchClient?.close?.();
    await app?.close();
    await mongo?.stop();
  });

  it("HTTP approval → outbox row → gRPC find → markSent", async () => {
    const admin = await seedAdmin();

    // 1) Register a shelter (opens a SHELTER_VERIFICATION approval).
    const reg = await request(app.getHttpServer())
      .post(`${PREFIX}/shelters`)
      .set(auth(admin.token))
      .send({
        name: "행복한 발자국",
        slug: `relay-${Date.now()}`,
        address: {
          region: "서울",
          city: "강남구",
          roadAddress: "테헤란로 1",
          visibility: AddressVisibility.PARTIAL,
        },
        businessNumber: String(2000000000 + seq),
      })
      .expect(201);
    const { approvalId } = reg.body.items;

    // 2) Operator approves — the callback writes a PENDING outbox row.
    await request(app.getHttpServer())
      .post(`${PREFIX}/approvals/${approvalId}/decision`)
      .set(auth(admin.token))
      .send({ decision: "APPROVE", metadata: { trustTier: "A" } })
      .expect(204);

    // 3) The relay polls PENDING SHELTER_VERIFICATION_APPROVED rows over gRPC.
    const found = await grpcCall(
      findClient,
      "FindOutboxByEventTypeAndStatusUseCase",
      {
        eventType: "SHELTER_VERIFICATION_APPROVED",
        status: "PENDING",
      },
      authMeta(),
    );
    expect(found.items.length).toBeGreaterThanOrEqual(1);
    const row = found.items[0];
    expect(row.eventType).toBe("SHELTER_VERIFICATION_APPROVED");
    expect(Object.keys(row.payload)).toContain("approval_approved");
    expect(row.payload.approval_approved.approval_type).toBe(
      "APPROVAL_TYPE_SHELTER_VERIFICATION",
    );
    expect(row.payload.approval_approved.recipient_user_id).toBe(admin.id);

    // 4) The relay marks it SENT after publishing.
    await grpcCall(
      patchClient,
      "PatchOutboxMarkAsSentUseCase",
      { eventId: row.eventId },
      authMeta(),
    );
    const persisted = await outboxModel
      .findOne({ eventId: row.eventId })
      .lean();
    expect(persisted?.status).toBe(OutboxStatus.SENT);

    // 5) The row no longer appears in a PENDING poll.
    const afterSent = await grpcCall(
      findClient,
      "FindOutboxByEventTypeAndStatusUseCase",
      {
        eventType: "SHELTER_VERIFICATION_APPROVED",
        status: "PENDING",
      },
      authMeta(),
    );
    expect(
      afterSent.items.some(
        (r: { eventId: string }) => r.eventId === row.eventId,
      ),
    ).toBe(false);
  });

  it("rejects a gRPC call missing the x-api-key", async () => {
    await expect(
      grpcCall(
        findClient,
        "FindOutboxByEventTypeAndStatusUseCase",
        { eventType: "SHELTER_VERIFICATION_APPROVED", status: "PENDING" },
        new grpc.Metadata(),
      ),
    ).rejects.toBeDefined();
  });
});
