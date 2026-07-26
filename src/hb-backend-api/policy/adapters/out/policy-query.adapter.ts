import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyQueryPort } from "src/hb-backend-api/policy/domain/ports/out/policy-query.port";
import { PolicyRepository } from "src/hb-backend-api/policy/domain/repositories/policy.repository";
import { toDomain } from "src/hb-backend-api/policy/adapters/out/policy.mapper";

@Injectable()
export class PolicyQueryAdapter implements PolicyQueryPort {
  constructor(
    @Inject(DIToken.PolicyModule.PolicyRepository)
    private readonly repository: PolicyRepository,
  ) {}

  public async findCurrent(type: PolicyType): Promise<PolicyDocument | null> {
    const doc = await this.repository.findCurrent(type);
    return doc ? toDomain(doc) : null;
  }

  public async findVersions(type: PolicyType): Promise<PolicyDocument[]> {
    const docs = await this.repository.findVersions(type);
    return docs.map(toDomain);
  }

  public async nextVersion(type: PolicyType): Promise<number> {
    return (await this.repository.maxVersion(type)) + 1;
  }
}
