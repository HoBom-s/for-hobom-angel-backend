import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { ExportPersonalDataService } from "src/hb-backend-api/dsar/application/use-cases/export-personal-data.service";

const actorId = new Types.ObjectId().toString();
const subjectId = new Types.ObjectId().toString();

const admin = { isPlatformAdmin: () => true };
const member = { isPlatformAdmin: () => false };

const personalData = () => ({
  userId: subjectId,
  email: "a@b.com",
  nickname: "nick",
  realName: "홍길동",
  phone: "010",
  roles: ["USER"],
  status: "ACTIVE",
  createdAt: new Date(0),
  withdrawnAt: null,
});

describe("ExportPersonalDataService", () => {
  const build = (over: { actor?: unknown; data?: unknown } = {}) => {
    const userQueryPort = {
      findById: jest
        .fn()
        .mockResolvedValue(over.actor === undefined ? admin : over.actor),
    };
    const personalDataPort = {
      read: jest
        .fn()
        .mockResolvedValue(
          over.data === undefined ? personalData() : over.data,
        ),
      anonymize: jest.fn(),
      countResidual: jest.fn(),
    };
    const audit = { record: jest.fn() };
    const service = new ExportPersonalDataService(
      userQueryPort as never,
      personalDataPort,
      audit,
    );
    return { service, audit, personalDataPort };
  };

  it("rejects a non-operator", async () => {
    const { service } = build({ actor: member });
    await expect(service.invoke({ actorId, subjectId })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("404s when the subject has no data", async () => {
    const { service, audit } = build({ data: null });
    await expect(service.invoke({ actorId, subjectId })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(audit.record).not.toHaveBeenCalled();
  });

  it("records EXPORT_PII and returns the decrypted PII", async () => {
    const { service, audit } = build();
    const data = await service.invoke({ actorId, subjectId, reason: "req#7" });

    expect(data.realName).toBe("홍길동");
    expect(audit.record).toHaveBeenCalledTimes(1);
    const event = audit.record.mock.calls[0][0] as { action: AuditAction };
    expect(event.action).toBe(AuditAction.EXPORT_PII);
  });
});
