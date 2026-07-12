import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";

@Schema({ collection: "volunteer_events", timestamps: true })
export class VolunteerEventEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true })
  public title: string;

  @Prop({ default: "" })
  public description: string;

  @Prop({ required: true, type: Date })
  public startAt: Date;

  @Prop({ required: true, type: Date })
  public endAt: Date;

  @Prop({ required: true })
  public capacity: number;

  @Prop({ required: true, default: 0 })
  public signedUpCount: number;

  @Prop({
    required: true,
    enum: VolunteerEventStatus,
    type: String,
    default: VolunteerEventStatus.OPEN,
  })
  public status: VolunteerEventStatus;

  @Prop({ required: true, default: 0 })
  public version: number;
}
