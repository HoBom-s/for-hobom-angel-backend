import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { MessageSubjectResolverRegistry } from "src/hb-backend-api/messaging/application/message-subject-resolver.registry";

/**
 * Resolves whether a user may take part in an application's conversation and on
 * which side. Participation is checked fresh (against the current application and
 * the current shelter roles), not stored, so access reflects reality.
 */
@Injectable()
export class ConversationAccessService {
  constructor(
    private readonly registry: MessageSubjectResolverRegistry,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async authorize(
    subjectType: MessageSubjectType,
    subjectRef: string,
    userId: string,
  ): Promise<MessageSenderRole> {
    const participants = await this.registry
      .get(subjectType)
      .resolve(subjectRef);
    if (!participants) {
      throw new NotFoundException("대화를 찾을 수 없어요.");
    }

    if (userId === participants.applicantId) {
      return MessageSenderRole.APPLICANT;
    }

    const user = await this.userQueryPort.findById(UserId.fromString(userId));
    if (
      user &&
      user.canManageShelter(ShelterId.fromString(participants.shelterId))
    ) {
      return MessageSenderRole.SHELTER;
    }

    throw new ForbiddenException("이 대화에 참여할 수 없어요.");
  }
}
