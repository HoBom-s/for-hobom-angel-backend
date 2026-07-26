import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";
import { VolunteerCertificateQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-certificate-query.port";
import { GetMyCertificatesUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/get-my-certificates.use-case";

@Injectable()
export class GetMyCertificatesService implements GetMyCertificatesUseCase {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerCertificateQueryPort)
    private readonly queryPort: VolunteerCertificateQueryPort,
  ) {}

  public invoke(userId: string): Promise<VolunteerCertificate[]> {
    return this.queryPort.findByUser(UserId.fromString(userId));
  }
}
