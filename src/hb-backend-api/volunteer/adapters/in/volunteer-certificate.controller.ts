import { Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelopeArray,
} from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { IssueVolunteerCertificateUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/issue-volunteer-certificate.use-case";
import { GetMyCertificatesUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/get-my-certificates.use-case";
import { VolunteerCertificateResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/volunteer-certificate.response";

/** Self-service volunteer certificates — issue from completed participations, list mine. */
@ApiTags("Volunteer")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class VolunteerCertificateController {
  constructor(
    @Inject(DIToken.VolunteerModule.IssueVolunteerCertificateUseCase)
    private readonly issueUseCase: IssueVolunteerCertificateUseCase,
    @Inject(DIToken.VolunteerModule.GetMyCertificatesUseCase)
    private readonly getMyUseCase: GetMyCertificatesUseCase,
  ) {}

  @ApiOperation({ summary: "봉사활동 확인서 발급 (완료된 참여 기준)" })
  @ApiCreatedEnvelope(VolunteerCertificateResponse)
  @Post("me/volunteer-certificates")
  public async issue(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VolunteerCertificateResponse> {
    const certificate = await this.issueUseCase.invoke(user.userId);
    return VolunteerCertificateResponse.from(certificate);
  }

  @ApiOperation({ summary: "내 봉사활동 확인서 목록" })
  @ApiEnvelopeArray(VolunteerCertificateResponse)
  @Get("me/volunteer-certificates")
  public async listMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VolunteerCertificateResponse[]> {
    const certificates = await this.getMyUseCase.invoke(user.userId);
    return certificates.map((c) => VolunteerCertificateResponse.from(c));
  }
}
