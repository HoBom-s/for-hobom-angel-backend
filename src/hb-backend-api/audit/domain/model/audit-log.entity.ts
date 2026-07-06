import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";

/**
 * Append-only audit record. Written inside the business transaction (or as a
 * standalone durable insert for read-only VIEW actions) so it is never lost.
 */
@Schema({ collection: "audit_logs", timestamps: true })
export class AuditLogEntity extends BaseEntity {
  @Prop({ required: true, enum: AuditAction, type: String })
  public action: AuditAction;

  @Prop({ required: true })
  public actorId: string;

  @Prop({ required: true })
  public subjectUserId: string;

  @Prop({ type: String })
  public field?: string;

  @Prop({ type: String })
  public reason?: string;

  @Prop({ type: String })
  public traceId?: string;
}
