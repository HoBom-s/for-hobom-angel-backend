import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyQueryPort } from "src/hb-backend-api/policy/domain/ports/out/policy-query.port";
import { GetCurrentPolicyUseCase } from "src/hb-backend-api/policy/domain/ports/in/get-current-policy.use-case";

/** Public read of the policy version currently in effect for a type. */
@Injectable()
export class GetCurrentPolicyService implements GetCurrentPolicyUseCase {
  constructor(
    @Inject(DIToken.PolicyModule.PolicyQueryPort)
    private readonly queryPort: PolicyQueryPort,
  ) {}

  public async invoke(type: PolicyType): Promise<PolicyDocument> {
    const document = await this.queryPort.findCurrent(type);
    if (!document) {
      throw new NotFoundException("아직 게시된 정책이 없어요.");
    }
    return document;
  }
}
