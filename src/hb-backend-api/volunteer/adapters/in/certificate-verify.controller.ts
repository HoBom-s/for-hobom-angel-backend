import { Controller, Get, Inject, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiEnvelope } from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { VerifyCertificateUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/verify-certificate.use-case";
import { VolunteerCertificateResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/volunteer-certificate.response";

/**
 * Public certificate verification — a receiving organization enters the
 * certificate number to confirm it's genuine. Unauthenticated by design.
 */
@ApiTags("Volunteer")
@Controller(EndPointPrefixConstant)
export class CertificateVerifyController {
  constructor(
    @Inject(DIToken.VolunteerModule.VerifyCertificateUseCase)
    private readonly verifyUseCase: VerifyCertificateUseCase,
  ) {}

  @ApiOperation({
    summary: "봉사활동 확인서 진위 검증 (공개, 발급번호로 조회)",
  })
  @ApiEnvelope(VolunteerCertificateResponse)
  @Get("volunteer-certificates/:certificateNo")
  public async verify(
    @Param("certificateNo") certificateNo: string,
  ): Promise<VolunteerCertificateResponse> {
    const certificate = await this.verifyUseCase.invoke(certificateNo);
    return VolunteerCertificateResponse.from(certificate);
  }
}
