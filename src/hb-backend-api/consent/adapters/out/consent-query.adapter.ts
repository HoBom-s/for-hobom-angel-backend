import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { ConsentQueryPort } from "src/hb-backend-api/consent/domain/ports/out/consent-query.port";
import { ConsentRepository } from "src/hb-backend-api/consent/domain/repositories/consent.repository";
import { toDomain } from "src/hb-backend-api/consent/adapters/out/consent.mapper";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

@Injectable()
export class ConsentQueryAdapter implements ConsentQueryPort {
  constructor(
    @Inject(DIToken.ConsentModule.ConsentRepository)
    private readonly repository: ConsentRepository,
  ) {}

  public async findByUser(userId: string): Promise<Consent[]> {
    const docs = await this.repository.findByUser(new Types.ObjectId(userId));
    return docs.map(toDomain);
  }

  public async findByUserAndType(
    userId: string,
    policyType: PolicyType,
  ): Promise<Consent | null> {
    const doc = await this.repository.findByUserAndType(
      new Types.ObjectId(userId),
      policyType,
    );
    return doc ? toDomain(doc) : null;
  }
}
