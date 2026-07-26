import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";
import { VolunteerCertificateQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-certificate-query.port";
import { VerifyCertificateUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/verify-certificate.use-case";

/** Public verification: a valid certificate number returns the issued record. */
@Injectable()
export class VerifyCertificateService implements VerifyCertificateUseCase {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerCertificateQueryPort)
    private readonly queryPort: VolunteerCertificateQueryPort,
  ) {}

  public async invoke(certificateNo: string): Promise<VolunteerCertificate> {
    const certificate = await this.queryPort.findByCertificateNo(certificateNo);
    if (!certificate) {
      throw new NotFoundException("유효하지 않은 확인서 번호예요.");
    }
    return certificate;
  }
}
