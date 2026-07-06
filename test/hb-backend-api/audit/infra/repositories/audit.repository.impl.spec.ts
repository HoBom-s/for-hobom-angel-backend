import { INestApplication } from "@nestjs/common";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Model } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditLogEntity } from "src/hb-backend-api/audit/domain/model/audit-log.entity";
import { AuditLogSchema } from "src/hb-backend-api/audit/domain/model/audit-log.schema";
import { AuditRepositoryImpl } from "src/hb-backend-api/audit/infra/repositories/audit.repository.impl";

describe("AuditRepositoryImpl", () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication;
  let repository: AuditRepositoryImpl;
  let model: Model<AuditLogEntity>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: AuditLogEntity.name, schema: AuditLogSchema },
        ]),
      ],
      providers: [AuditRepositoryImpl],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    repository = app.get(AuditRepositoryImpl);
    model = app.get(getModelToken(AuditLogEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("appends an audit record with a timestamp", async () => {
    await repository.save(
      AuditEvent.of({
        action: AuditAction.VIEW_PII,
        actorId: "operator-1",
        subjectUserId: "user-9",
        field: "realName",
        reason: "DSAR",
      }),
    );

    const rows = await model.find({ subjectUserId: "user-9" }).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe(AuditAction.VIEW_PII);
    expect(rows[0].actorId).toBe("operator-1");
    expect(rows[0].field).toBe("realName");
    expect(rows[0].createdAt).toBeInstanceOf(Date);
  });
});
