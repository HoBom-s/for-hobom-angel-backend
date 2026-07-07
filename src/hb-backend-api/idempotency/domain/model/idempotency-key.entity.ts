import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

/**
 * Records that an operation identified by (scope, key) has been performed, so a
 * retried request runs at most once. `scope` namespaces the key (e.g. the
 * operation type) so unrelated features can't collide.
 */
@Schema({ collection: "idempotency_keys", timestamps: true })
export class IdempotencyKeyEntity extends BaseEntity {
  @Prop({ required: true })
  public scope: string;

  @Prop({ required: true })
  public key: string;
}
