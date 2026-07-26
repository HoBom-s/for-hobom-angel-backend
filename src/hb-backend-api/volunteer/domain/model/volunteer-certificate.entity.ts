import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";

/** A snapshotted participation line on a certificate (immutable at issue time). */
export interface CertificateItemDoc {
  eventId: Types.ObjectId;
  eventTitle: string;
  shelterId: Types.ObjectId;
  shelterName: string;
  startAt: Date;
  endAt: Date;
  minutes: number;
}

/**
 * An issued volunteer-service certificate (봉사활동 확인서). Snapshots the member's
 * completed participations at issue time so it stays verifiable even if events or
 * shelters later change. `certificateNo` is unique and unguessable — the token a
 * receiving org uses to verify authenticity.
 */
@Schema({ collection: "volunteer_certificates", timestamps: true })
export class VolunteerCertificateEntity extends BaseEntity {
  @Prop({ required: true, unique: true })
  public certificateNo: string;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public userId: Types.ObjectId;

  @Prop({ required: true })
  public volunteerNickname: string;

  @Prop({ required: true, type: Date })
  public issuedAt: Date;

  @Prop({ required: true, default: 0 })
  public totalCount: number;

  @Prop({ required: true, default: 0 })
  public totalMinutes: number;

  @Prop({
    type: [
      {
        eventId: { type: Types.ObjectId, required: true },
        eventTitle: { type: String, required: true },
        shelterId: { type: Types.ObjectId, required: true },
        shelterName: { type: String, required: true },
        startAt: { type: Date, required: true },
        endAt: { type: Date, required: true },
        minutes: { type: Number, required: true },
      },
    ],
    default: [],
  })
  public items: CertificateItemDoc[];
}
