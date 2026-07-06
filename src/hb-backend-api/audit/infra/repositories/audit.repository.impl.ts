import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditLogEntity } from "src/hb-backend-api/audit/domain/model/audit-log.entity";
import { AuditRepository } from "src/hb-backend-api/audit/domain/repositories/audit.repository";

@Injectable()
export class AuditRepositoryImpl implements AuditRepository {
  constructor(
    @InjectModel(AuditLogEntity.name)
    private readonly auditModel: Model<AuditLogEntity>,
  ) {}

  public async save(event: AuditEvent): Promise<void> {
    // Joins the ambient transaction when present; otherwise a standalone insert.
    const session = MongoSessionContext.getSession();
    await this.auditModel.create(
      [
        {
          action: event.action,
          actorId: event.actorId,
          subjectUserId: event.subjectUserId,
          field: event.field ?? undefined,
          reason: event.reason ?? undefined,
          traceId: event.traceId ?? undefined,
        },
      ],
      { session },
    );
  }
}
