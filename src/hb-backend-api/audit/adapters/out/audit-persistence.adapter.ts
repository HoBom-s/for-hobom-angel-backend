import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditPersistencePort } from "src/hb-backend-api/audit/domain/ports/out/audit-persistence.port";
import { AuditRepository } from "src/hb-backend-api/audit/domain/repositories/audit.repository";

@Injectable()
export class AuditPersistenceAdapter implements AuditPersistencePort {
  constructor(
    @Inject(DIToken.AuditModule.AuditRepository)
    private readonly auditRepository: AuditRepository,
  ) {}

  public record(event: AuditEvent): Promise<void> {
    return this.auditRepository.save(event);
  }
}
