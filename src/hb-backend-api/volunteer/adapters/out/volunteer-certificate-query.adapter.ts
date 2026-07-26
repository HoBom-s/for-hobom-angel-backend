import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";
import { VolunteerCertificateQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-certificate-query.port";
import { VolunteerCertificateRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-certificate.repository";
import { toDomain } from "src/hb-backend-api/volunteer/adapters/out/volunteer-certificate.mapper";

@Injectable()
export class VolunteerCertificateQueryAdapter implements VolunteerCertificateQueryPort {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerCertificateRepository)
    private readonly repository: VolunteerCertificateRepository,
  ) {}

  public async findByCertificateNo(
    certificateNo: string,
  ): Promise<VolunteerCertificate | null> {
    const doc = await this.repository.findByCertificateNo(certificateNo);
    return doc ? toDomain(doc) : null;
  }

  public async findByUser(userId: UserId): Promise<VolunteerCertificate[]> {
    const docs = await this.repository.findByUser(userId.raw);
    return docs.map(toDomain);
  }
}
