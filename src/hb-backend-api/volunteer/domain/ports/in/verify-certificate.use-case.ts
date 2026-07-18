import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";

/** Public verification of an issued certificate by its number. */
export interface VerifyCertificateUseCase {
  invoke(certificateNo: string): Promise<VolunteerCertificate>;
}
