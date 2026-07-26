import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiCreatedEnvelope } from "src/shared/response/api-envelope.decorator";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import {
  CreateUploadUrlResult,
  CreateUploadUrlUseCase,
} from "src/hb-backend-api/media/domain/ports/in/create-upload-url.use-case";
import { CreateUploadUrlDto } from "src/hb-backend-api/media/adapters/in/dto/create-upload-url.dto";
import { CreateUploadUrlResponse } from "src/hb-backend-api/media/adapters/in/dto/create-upload-url.response";

@ApiTags("Media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(`${EndPointPrefixConstant}/media`)
export class MediaController {
  constructor(
    @Inject(DIToken.MediaModule.CreateUploadUrlUseCase)
    private readonly createUploadUrlUseCase: CreateUploadUrlUseCase,
  ) {}

  @ApiOperation({
    summary:
      "이미지 업로드용 presigned URL 발급 — 클라이언트가 스토리지로 직접 업로드",
  })
  @ApiCreatedEnvelope(CreateUploadUrlResponse)
  @Post("upload-url")
  public createUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateUploadUrlDto,
  ): Promise<CreateUploadUrlResult> {
    return this.createUploadUrlUseCase.invoke({
      purpose: body.purpose,
      contentType: body.contentType,
      uploaderId: user.userId,
    });
  }
}
