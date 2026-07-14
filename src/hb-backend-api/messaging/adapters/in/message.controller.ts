import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelopeArray,
} from "src/shared/response/api-envelope.decorator";
import { PostMessageResponse } from "src/hb-backend-api/messaging/adapters/in/dto/post-message.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import {
  PostMessageResult,
  PostMessageUseCase,
} from "src/hb-backend-api/messaging/domain/ports/in/post-message.use-case";
import { ListConversationMessagesUseCase } from "src/hb-backend-api/messaging/domain/ports/in/list-conversation-messages.use-case";
import { PostMessageDto } from "src/hb-backend-api/messaging/adapters/in/dto/post-message.dto";
import { MessageResponse } from "src/hb-backend-api/messaging/adapters/in/dto/message.response";

@ApiTags("Messaging")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiParam({ name: "subjectType", enum: MessageSubjectType })
@Controller(
  `${EndPointPrefixConstant}/conversations/:subjectType/:subjectRef/messages`,
)
export class MessageController {
  constructor(
    @Inject(DIToken.MessagingModule.PostMessageUseCase)
    private readonly postMessageUseCase: PostMessageUseCase,
    @Inject(DIToken.MessagingModule.ListConversationMessagesUseCase)
    private readonly listConversationMessagesUseCase: ListConversationMessagesUseCase,
  ) {}

  @ApiOperation({ summary: "문의 메시지 전송 (신청자 또는 보호소 담당자)" })
  @ApiCreatedEnvelope(PostMessageResponse)
  @Post()
  public post(
    @CurrentUser() user: AuthenticatedUser,
    @Param("subjectType", new ParseEnumPipe(MessageSubjectType))
    subjectType: MessageSubjectType,
    @Param("subjectRef") subjectRef: string,
    @Body() body: PostMessageDto,
  ): Promise<PostMessageResult> {
    return this.postMessageUseCase.invoke({
      subjectType,
      subjectRef,
      senderId: user.userId,
      body: body.body,
    });
  }

  @ApiOperation({ summary: "문의 대화 조회 (참여자)" })
  @ApiEnvelopeArray(MessageResponse)
  @Get()
  public async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("subjectType", new ParseEnumPipe(MessageSubjectType))
    subjectType: MessageSubjectType,
    @Param("subjectRef") subjectRef: string,
  ): Promise<MessageResponse[]> {
    const messages = await this.listConversationMessagesUseCase.invoke({
      subjectType,
      subjectRef,
      readerId: user.userId,
    });
    return messages.map((message) => MessageResponse.from(message));
  }
}
