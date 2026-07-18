import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyQueryPort } from "src/hb-backend-api/policy/domain/ports/out/policy-query.port";
import {
  ListPolicyVersionsCommand,
  ListPolicyVersionsUseCase,
} from "src/hb-backend-api/policy/domain/ports/in/list-policy-versions.use-case";

/** Operator views the version history of a policy type. */
@Injectable()
export class ListPolicyVersionsService implements ListPolicyVersionsUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.PolicyModule.PolicyQueryPort)
    private readonly queryPort: PolicyQueryPort,
  ) {}

  public async invoke(
    command: ListPolicyVersionsCommand,
  ): Promise<PolicyDocument[]> {
    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 조회할 수 있어요.");
    }
    return this.queryPort.findVersions(command.type);
  }
}
