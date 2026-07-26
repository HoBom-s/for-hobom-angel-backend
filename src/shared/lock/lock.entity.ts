import { Prop, Schema } from "@nestjs/mongoose";

/**
 * A held distributed lock. `_id` IS the lock name (so uniqueness — one holder —
 * is enforced by the primary key). `owner` is the holder's per-process id;
 * `expiresAt` bounds how long a crashed holder can keep it.
 */
@Schema({ collection: "locks", versionKey: false, timestamps: false })
export class LockEntity {
  @Prop({ type: String })
  public _id: string;

  @Prop({ required: true })
  public owner: string;

  @Prop({ required: true, type: Date })
  public expiresAt: Date;
}
