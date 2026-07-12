import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";

@Schema({ collection: "volunteer_signups", timestamps: true })
export class VolunteerSignupEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "volunteer_events" })
  public eventId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public volunteerId: Types.ObjectId;

  @Prop({
    required: true,
    enum: VolunteerSignupStatus,
    type: String,
    default: VolunteerSignupStatus.ACTIVE,
  })
  public status: VolunteerSignupStatus;

  @Prop({ required: true, default: 0 })
  public version: number;
}
