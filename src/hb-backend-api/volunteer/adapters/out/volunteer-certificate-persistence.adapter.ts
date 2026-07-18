import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";
import { VolunteerCertificatePersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-certificate-persistence.port";
import { VolunteerCertificateRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-certificate.repository";
import {
  toDomain,
  toInsertDoc,
} from "src/hb-backend-api/volunteer/adapters/out/volunteer-certificate.mapper";

@Injectable()
export class VolunteerCertificatePersistenceAdapter implements VolunteerCertificatePersistencePort {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerCertificateRepository)
    private readonly repository: VolunteerCertificateRepository,
  ) {}

  public async save(
    certificate: VolunteerCertificate,
  ): Promise<VolunteerCertificate> {
    const created = await this.repository.insert(toInsertDoc(certificate));
    return toDomain(created);
  }
}
