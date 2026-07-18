import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";

/** Read side for issued volunteer certificates. */
export interface VolunteerCertificateQueryPort {
  findByCertificateNo(
    certificateNo: string,
  ): Promise<VolunteerCertificate | null>;
  findByUser(userId: UserId): Promise<VolunteerCertificate[]>;
}
