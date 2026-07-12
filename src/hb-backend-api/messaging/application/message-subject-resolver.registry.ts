import { Injectable } from "@nestjs/common";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { MessageSubjectResolver } from "src/hb-backend-api/messaging/domain/ports/out/message-subject-resolver";

/**
 * Maps each {@link MessageSubjectType} to its participant resolver. The owning
 * domain (adoption/foster) self-registers on init, keeping messaging ignorant of
 * those domains — the same plug-in pattern as the approval-callback registry.
 */
@Injectable()
export class MessageSubjectResolverRegistry {
  private readonly resolvers = new Map<
    MessageSubjectType,
    MessageSubjectResolver
  >();

  public register(resolver: MessageSubjectResolver): void {
    this.resolvers.set(resolver.subjectType, resolver);
  }

  public get(subjectType: MessageSubjectType): MessageSubjectResolver {
    const resolver = this.resolvers.get(subjectType);
    if (!resolver) {
      throw new Error(`등록된 대화 resolver가 없어요: ${subjectType}`);
    }
    return resolver;
  }
}
