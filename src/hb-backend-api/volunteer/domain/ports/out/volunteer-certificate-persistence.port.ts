import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";

/** Write side for issued volunteer certificates. */
export interface VolunteerCertificatePersistencePort {
  save(certificate: VolunteerCertificate): Promise<VolunteerCertificate>;
}
