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
import { ReportReason } from "src/hb-backend-api/report/domain/enums/report-reason.enum";
import { ReportResolution } from "src/hb-backend-api/report/domain/enums/report-resolution.enum";
import { ReportStatus } from "src/hb-backend-api/report/domain/enums/report-status.enum";
import { ReportTargetType } from "src/hb-backend-api/report/domain/enums/report-target-type.enum";
import { ReportEntity } from "src/hb-backend-api/report/domain/model/report.entity";
import { SubmitReportUseCase } from "src/hb-backend-api/report/domain/ports/in/submit-report.use-case";
import { ResolveReportUseCase } from "src/hb-backend-api/report/domain/ports/in/resolve-report.use-case";
import { ListPendingReportsUseCase } from "src/hb-backend-api/report/domain/ports/in/list-pending-reports.use-case";

/**
 * End-to-end slice: a member reports a target, a SYSTEM_ADMIN reviews the queue
 * and resolves it — proving the report lifecycle and operator-only authorization
 * through the real DI graph and a Mongo transaction.
 */
describe("Report (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let submitReport: SubmitReportUseCase;
  let resolveReport: ResolveReportUseCase;
  let listPending: ListPendingReportsUseCase;
  let reportModel: Model<ReportEntity>;
  let userModel: Model<UserEntity>;

  let seq = 0;
  const seedUser = async (
    roles: UserRole[] = [UserRole.USER],
  ): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `u-${seq}`,
      realNameEnc: "enc",
      ci: `ci-${id.toHexString()}`,
      phoneEnc: "enc",
      email: "u@example.com",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles,
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id.toHexString();
  };

  const report = (reporterId: string) => ({
    reporterId,
    targetType: ReportTargetType.SHELTER,
    targetRef: new Types.ObjectId().toHexString(),
    reason: ReportReason.FAKE_SHELTER,
    detail: "허위 보호소 같아요.",
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
    await app.init();

    submitReport = app.get(DIToken.ReportModule.SubmitReportUseCase);
    resolveReport = app.get(DIToken.ReportModule.ResolveReportUseCase);
    listPending = app.get(DIToken.ReportModule.ListPendingReportsUseCase);
    reportModel = app.get(getModelToken(ReportEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("queues a report and lets an operator resolve it", async () => {
    const reporter = await seedUser();
    const admin = await seedUser([UserRole.USER, UserRole.SYSTEM_ADMIN]);

    const { reportId } = await submitReport.invoke(report(reporter));

    const queue = await listPending.invoke({ viewerId: admin, limit: 50 });
    expect(queue.some((r) => r.getId.toString() === reportId)).toBe(true);

    await resolveReport.invoke({
      reportId,
      resolvedBy: admin,
      resolution: ReportResolution.UPHELD,
      note: "확인 후 제재",
    });

    const doc = await reportModel.findById(reportId).lean().exec();
    expect(doc?.status).toBe(ReportStatus.RESOLVED);
    expect(doc?.resolution).toBe(ReportResolution.UPHELD);
    expect(String(doc?.resolvedBy)).toBe(admin);
  });

  it("refuses a non-operator to view the queue or resolve", async () => {
    const reporter = await seedUser();
    const { reportId } = await submitReport.invoke(report(reporter));
    const outsider = await seedUser();

    await expect(
      listPending.invoke({ viewerId: outsider, limit: 50 }),
    ).rejects.toThrow("운영자");

    await expect(
      resolveReport.invoke({
        reportId,
        resolvedBy: outsider,
        resolution: ReportResolution.DISMISSED,
      }),
    ).rejects.toThrow("운영자");
  });
});
