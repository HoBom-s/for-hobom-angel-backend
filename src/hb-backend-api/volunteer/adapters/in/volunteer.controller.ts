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
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import {
  CreateVolunteerEventResult,
  CreateVolunteerEventUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/create-volunteer-event.use-case";
import {
  SignUpForVolunteerResult,
  SignUpForVolunteerUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/sign-up-for-volunteer.use-case";
import { WithdrawVolunteerSignupUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/withdraw-volunteer-signup.use-case";
import { CancelVolunteerEventUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/cancel-volunteer-event.use-case";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { CreateVolunteerEventDto } from "src/hb-backend-api/volunteer/adapters/in/dto/create-volunteer-event.dto";
import { VolunteerEventResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/volunteer-event.response";
import { CreateVolunteerEventResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/create-volunteer-event.response";
import { VolunteerSignupResponse } from "src/hb-backend-api/volunteer/adapters/in/dto/volunteer-signup.response";

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
    @Inject(DIToken.VolunteerModule.CancelVolunteerEventUseCase)
    private readonly cancelVolunteerEventUseCase: CancelVolunteerEventUseCase,
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
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

  @ApiOperation({ summary: "보호소 봉사 일정 목록" })
  @ApiEnvelopeArray(VolunteerEventResponse)
  @Get("shelters/:shelterId/volunteer-events")
  public async listByShelter(
    @Param("shelterId") shelterId: string,
  ): Promise<VolunteerEventResponse[]> {
    const events = await this.eventQueryPort.findByShelter(
      ShelterId.fromString(shelterId),
    );
    return events.map((event) => VolunteerEventResponse.from(event));
  }

  @ApiOperation({ summary: "다가오는 모집 중 봉사 (탐색)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiEnvelopeArray(VolunteerEventResponse)
  @Get("volunteer-events")
  public async upcoming(
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<VolunteerEventResponse[]> {
    const events = await this.eventQueryPort.findUpcoming(
      new Date(),
      Math.min(Math.max(limit, 1), 50),
    );
    return events.map((event) => VolunteerEventResponse.from(event));
  }

  @ApiOperation({ summary: "봉사 일정 단건 조회" })
  @ApiEnvelope(VolunteerEventResponse)
  @Get("volunteer-events/:eventId")
  public async getOne(
    @Param("eventId") eventId: string,
  ): Promise<VolunteerEventResponse> {
    const event = await this.eventQueryPort.findById(
      VolunteerEventId.fromString(eventId),
    );
    if (!event) {
      throw new NotFoundException("봉사 일정을 찾을 수 없어요.");
    }
    return VolunteerEventResponse.from(event);
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
}
