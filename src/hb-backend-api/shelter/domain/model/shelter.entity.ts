import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { FacilityPhotoKind } from "src/hb-backend-api/shelter/domain/enums/facility-photo-kind.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";

export interface AddressDoc {
  region: string;
  city: string;
  roadAddress: string;
  lat: number | null;
  lng: number | null;
  visibility: AddressVisibility;
}

export interface FacilityPhotoDoc {
  objectKey: string;
  kind: FacilityPhotoKind;
  caption?: string;
}

export interface VerificationSignalsDoc {
  registryMatch: SignalStatus;
  businessValid: SignalStatus;
  nameMatch: SignalStatus;
  checkedAt: Date;
}

export interface ShelterProfileDoc {
  intro?: string | null;
  operatingSince?: Date | null;
  representativeName?: string | null;
  visitGuide?: string | null;
  supportGuide?: string | null;
}

@Schema({ collection: "shelters", timestamps: true })
export class ShelterEntity extends BaseEntity {
  @Prop({ required: true })
  public name: string;

  @Prop({ required: true, unique: true })
  public slug: string;

  @Prop({
    required: true,
    type: {
      region: String,
      city: String,
      roadAddress: String,
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      visibility: { type: String, enum: AddressVisibility },
    },
  })
  public address: AddressDoc;

  @Prop({ type: [Types.ObjectId], ref: "users", default: [] })
  public representatives: Types.ObjectId[];

  @Prop({ type: String })
  public registrationNumber?: string;

  @Prop({ type: String })
  public businessNumber?: string;

  @Prop({
    type: [{ objectKey: String, kind: String, caption: String }],
    default: [],
  })
  public facilityPhotos: FacilityPhotoDoc[];

  @Prop({
    required: true,
    enum: ShelterStatus,
    type: String,
    default: ShelterStatus.PENDING_VERIFICATION,
  })
  public status: ShelterStatus;

  @Prop({ type: String, enum: TrustTier })
  public trustTier?: TrustTier;

  @Prop({ type: Date })
  public verifiedAt?: Date;

  @Prop({ type: String })
  public rejectionReason?: string;

  @Prop({
    type: {
      registryMatch: String,
      businessValid: String,
      nameMatch: String,
      checkedAt: Date,
    },
  })
  public verificationSignals?: VerificationSignalsDoc;

  @Prop({ required: true, default: 0 })
  public version: number;

  // Public "About" content (edited in §07, shown on §04). All optional.
  @Prop({
    type: {
      intro: { type: String, default: null },
      operatingSince: { type: Date, default: null },
      representativeName: { type: String, default: null },
      visitGuide: { type: String, default: null },
      supportGuide: { type: String, default: null },
    },
    default: {},
  })
  public profile?: ShelterProfileDoc;
}
