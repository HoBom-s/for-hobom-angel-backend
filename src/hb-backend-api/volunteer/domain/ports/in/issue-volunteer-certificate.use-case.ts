import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";

/** A member issues a certificate for their completed volunteer participations. */
export interface IssueVolunteerCertificateUseCase {
  invoke(userId: string): Promise<VolunteerCertificate>;
}
