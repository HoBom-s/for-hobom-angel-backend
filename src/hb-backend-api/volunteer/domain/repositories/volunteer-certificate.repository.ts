import { Types } from "mongoose";
import { VolunteerCertificateEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate.entity";

/** Persistence contract over the volunteer_certificates collection. */
export interface VolunteerCertificateRepository {
  insert(
    doc: Partial<VolunteerCertificateEntity>,
  ): Promise<VolunteerCertificateEntity>;
  findByCertificateNo(
    certificateNo: string,
  ): Promise<VolunteerCertificateEntity | null>;
  findByUser(userId: Types.ObjectId): Promise<VolunteerCertificateEntity[]>;
}
