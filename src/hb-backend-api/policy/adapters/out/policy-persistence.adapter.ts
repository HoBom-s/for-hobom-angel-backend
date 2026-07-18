import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyPersistencePort } from "src/hb-backend-api/policy/domain/ports/out/policy-persistence.port";
import { PolicyRepository } from "src/hb-backend-api/policy/domain/repositories/policy.repository";
import {
  toDomain,
  toInsertDoc,
} from "src/hb-backend-api/policy/adapters/out/policy.mapper";

@Injectable()
export class PolicyPersistenceAdapter implements PolicyPersistencePort {
  constructor(
    @Inject(DIToken.PolicyModule.PolicyRepository)
    private readonly repository: PolicyRepository,
  ) {}

  public archiveCurrent(type: PolicyType): Promise<void> {
    return this.repository.archivePublished(type);
  }

  public async save(document: PolicyDocument): Promise<PolicyDocument> {
    const created = await this.repository.insert(toInsertDoc(document));
    return toDomain(created);
  }
}
