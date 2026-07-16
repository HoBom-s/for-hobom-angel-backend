import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelope,
  ApiEnvelopeArray,
} from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import {
  CreateVolunteerEventResult,
  CreateVolunteerEventUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/create-volunteer-event.use-case";
import {
  SignUpForVolunteerResult,
  SignUpForVolunteerUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/sign-up-for-volunteer.use-case";
import { WithdrawVolunteerSignupUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/withdraw-volunteer-signup.use-case";
import { DecideVolunteerSignupUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/decide-volunteer-signup.use-case";
import { ListEventSignupsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/list-event-signups.use-case";
import { ReadVolunteerEventsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/read-volunteer-events.use-case";
import { CancelVolunteerEventUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/cancel-volunteer-event.use-case";
import { CreateVolunteerEventDto } from "src/hb-backend-api/volunteer/adapters/in/dto/create-volunteer-event.dto";
import { DecideVolunteerSignupDto } from "src/hb-backend-api/volunteer/adapters/in/dto/decide-volunteer-signup.dto";
import { VolunteerEventResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/volunteer-event.response";
import { CreateVolunteerEventResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/create-volunteer-event.response";
import { VolunteerSignupResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/volunteer-signup.response";
import { VolunteerApplicantResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/volunteer-applicant.response";

@ApiTags("Volunteer")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class VolunteerController {
  constructor(
    @Inject(DIToken.VolunteerModule.CreateVolunteerEventUseCase)
    private readonly createVolunteerEventUseCase: CreateVolunteerEventUseCase,
    @Inject(DIToken.VolunteerModule.SignUpForVolunteerUseCase)
    private readonly signUpForVolunteerUseCase: SignUpForVolunteerUseCase,
    @Inject(DIToken.VolunteerModule.WithdrawVolunteerSignupUseCase)
    private readonly withdrawVolunteerSignupUseCase: WithdrawVolunteerSignupUseCase,
    @Inject(DIToken.VolunteerModule.DecideVolunteerSignupUseCase)
    private readonly decideVolunteerSignupUseCase: DecideVolunteerSignupUseCase,
    @Inject(DIToken.VolunteerModule.ListEventSignupsUseCase)
    private readonly listEventSignupsUseCase: ListEventSignupsUseCase,
    @Inject(DIToken.VolunteerModule.ReadVolunteerEventsUseCase)
    private readonly readVolunteerEventsUseCase: ReadVolunteerEventsUseCase,
    @Inject(DIToken.VolunteerModule.CancelVolunteerEventUseCase)
    private readonly cancelVolunteerEventUseCase: CancelVolunteerEventUseCase,
  ) {}

  @ApiOperation({ summary: "봉사 일정 개설 (검증된 보호소의 스태프)" })
  @ApiCreatedEnvelope(CreateVolunteerEventResponse)
  @Post("shelters/:shelterId/volunteer-events")
  public create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Body() body: CreateVolunteerEventDto,
  ): Promise<CreateVolunteerEventResult> {
    return this.createVolunteerEventUseCase.invoke({
      shelterId,
      createdBy: user.userId,
      ...body,
    });
  }

  @ApiOperation({ summary: "보호소 봉사 일정 목록 (내 신청 상태 포함)" })
  @ApiEnvelopeArray(VolunteerEventResponse)
  @Get("shelters/:shelterId/volunteer-events")
  public async listByShelter(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
  ): Promise<VolunteerEventResponse[]> {
    const views = await this.readVolunteerEventsUseCase.byShelter(
      shelterId,
      user.userId,
    );
    return views.map((view) => VolunteerEventResponse.from(view));
  }

  @ApiOperation({ summary: "다가오는 모집 중 봉사 (탐색, 내 신청 상태 포함)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiEnvelopeArray(VolunteerEventResponse)
  @Get("volunteer-events")
  public async upcoming(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<VolunteerEventResponse[]> {
    const views = await this.readVolunteerEventsUseCase.upcoming(
      user.userId,
      Math.min(Math.max(limit, 1), 50),
    );
    return views.map((view) => VolunteerEventResponse.from(view));
  }

  @ApiOperation({ summary: "봉사 일정 단건 조회 (내 신청 상태 포함)" })
  @ApiEnvelope(VolunteerEventResponse)
  @Get("volunteer-events/:eventId")
  public async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
  ): Promise<VolunteerEventResponse> {
    const view = await this.readVolunteerEventsUseCase.one(
      eventId,
      user.userId,
    );
    if (!view) {
      throw new NotFoundException("봉사 일정을 찾을 수 없어요.");
    }
    return VolunteerEventResponse.from(view);
  }

  @ApiOperation({ summary: "봉사 지원" })
  @ApiCreatedEnvelope(VolunteerSignupResponse)
  @Post("volunteer-events/:eventId/signups")
  public signUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
  ): Promise<SignUpForVolunteerResult> {
    return this.signUpForVolunteerUseCase.invoke({
      eventId,
      volunteerId: user.userId,
    });
  }

  @ApiOperation({ summary: "봉사 일정 취소 (스태프)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("volunteer-events/:eventId/cancellation")
  public cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
  ): Promise<void> {
    return this.cancelVolunteerEventUseCase.invoke({
      eventId,
      cancelledBy: user.userId,
    });
  }

  @ApiOperation({ summary: "봉사 지원 철회" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("volunteer-signups/:signupId/withdrawal")
  public withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param("signupId") signupId: string,
  ): Promise<void> {
    return this.withdrawVolunteerSignupUseCase.invoke({
      signupId,
      volunteerId: user.userId,
    });
  }

  @ApiOperation({ summary: "봉사 지원자 목록 (스태프)" })
  @ApiEnvelopeArray(VolunteerApplicantResponse)
  @Get("volunteer-events/:eventId/signups")
  public async listApplicants(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventId") eventId: string,
  ): Promise<VolunteerApplicantResponse[]> {
    const signups = await this.listEventSignupsUseCase.invoke(
      eventId,
      user.userId,
    );
    return signups.map((signup) => VolunteerApplicantResponse.from(signup));
  }

  @ApiOperation({ summary: "봉사 지원자 승인/거절 (스태프)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("volunteer-signups/:signupId/decision")
  public decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param("signupId") signupId: string,
    @Body() body: DecideVolunteerSignupDto,
  ): Promise<void> {
    return this.decideVolunteerSignupUseCase.invoke({
      signupId,
      actorId: user.userId,
      decision: body.decision,
    });
  }
}
