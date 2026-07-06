import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Base for all persisted entities. `timestamps: true` maintains createdAt/updatedAt.
 * Concrete entities override the collection via `@Schema({ collection: "..." })`.
 */
@Schema({ timestamps: true })
export abstract class BaseEntity extends Document {
  @Prop()
  public createdAt: Date;

  @Prop()
  public updatedAt: Date;
}
