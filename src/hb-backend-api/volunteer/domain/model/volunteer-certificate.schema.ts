import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerCertificateEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate.entity";

export const VolunteerCertificateSchema = SchemaFactory.createForClass(
  VolunteerCertificateEntity,
);

// Verification looks up by the (unique) certificate number.
VolunteerCertificateSchema.index({ certificateNo: 1 }, { unique: true });
// A member's own issued certificates, newest first.
VolunteerCertificateSchema.index({ userId: 1, _id: -1 });
