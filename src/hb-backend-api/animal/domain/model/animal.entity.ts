import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";

export interface TraitsDoc {
  sex: AnimalSex;
  size: AnimalSize;
  ageMonths?: number | null;
  breed?: string | null;
  color?: string | null;
  personality?: string | null;
  weightKg?: number | null;
}

export interface HealthDoc {
  neutered: boolean;
  vaccinated: boolean;
  microchipId?: string | null;
  notes?: string | null;
}

export interface IntakeDoc {
  intakeDate: Date;
  rescueStory?: string | null;
  noticeNumber?: string | null;
}

export interface AnimalPhotoDoc {
  objectKey: string;
  caption?: string;
}

@Schema({ collection: "animals", timestamps: true })
export class AnimalEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true })
  public name: string;

  @Prop({ required: true, enum: AnimalSpecies, type: String })
  public species: AnimalSpecies;

  @Prop({ default: "" })
  public description: string;

  @Prop({
    required: true,
    type: {
      sex: { type: String, enum: AnimalSex },
      size: { type: String, enum: AnimalSize },
      ageMonths: { type: Number, default: null },
      breed: { type: String, default: null },
      color: { type: String, default: null },
      personality: { type: String, default: null },
      weightKg: { type: Number, default: null },
    },
  })
  public traits: TraitsDoc;

  @Prop({
    required: true,
    type: {
      neutered: Boolean,
      vaccinated: Boolean,
      microchipId: { type: String, default: null },
      notes: { type: String, default: null },
    },
  })
  public health: HealthDoc;

  @Prop({
    required: true,
    type: {
      intakeDate: Date,
      rescueStory: { type: String, default: null },
      noticeNumber: { type: String, default: null },
    },
  })
  public intake: IntakeDoc;

  @Prop({ type: [{ objectKey: String, caption: String }], default: [] })
  public photos: AnimalPhotoDoc[];

  @Prop({
    required: true,
    enum: AnimalStatus,
    type: String,
    default: AnimalStatus.AVAILABLE,
  })
  public status: AnimalStatus;

  // Operator moderation: hidden from public discovery when true.
  @Prop({ required: true, default: false })
  public blinded: boolean;

  @Prop({ required: true, default: 0 })
  public version: number;
}
