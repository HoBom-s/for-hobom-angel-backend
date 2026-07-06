import { Test } from "@nestjs/testing";
import { DIToken } from "src/shared/di/token.di";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditPersistenceAdapter } from "src/hb-backend-api/audit/adapters/out/audit-persistence.adapter";

describe("AuditPersistenceAdapter", () => {
  it("delegates record to the repository", async () => {
    const repo = { save: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        AuditPersistenceAdapter,
        { provide: DIToken.AuditModule.AuditRepository, useValue: repo },
      ],
    }).compile();

    const adapter = module.get(AuditPersistenceAdapter);
    const event = AuditEvent.of({
      action: AuditAction.VIEW_PII,
      actorId: "a",
      subjectUserId: "b",
    });
    await adapter.record(event);
    expect(repo.save).toHaveBeenCalledWith(event);
  });
});
