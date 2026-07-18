import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";

/** A member lists their own issued certificates. */
export interface GetMyCertificatesUseCase {
  invoke(userId: string): Promise<VolunteerCertificate[]>;
}
