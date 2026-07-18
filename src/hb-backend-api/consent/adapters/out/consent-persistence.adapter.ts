import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { ConsentPersistencePort } from "src/hb-backend-api/consent/domain/ports/out/consent-persistence.port";
import { ConsentRepository } from "src/hb-backend-api/consent/domain/repositories/consent.repository";
import {
  toDomain,
  toInsertDoc,
} from "src/hb-backend-api/consent/adapters/out/consent.mapper";

@Injectable()
export class ConsentPersistenceAdapter implements ConsentPersistencePort {
  constructor(
    @Inject(DIToken.ConsentModule.ConsentRepository)
    private readonly repository: ConsentRepository,
  ) {}

  public async create(consent: Consent): Promise<Consent> {
    const created = await this.repository.insert(toInsertDoc(consent));
    return toDomain(created);
  }

  public async save(consent: Consent): Promise<Consent> {
    const id = consent.getId;
    if (!id) {
      throw new Error("저장할 동의 레코드 id가 없어요.");
    }
    await this.repository.update(new Types.ObjectId(id), {
      agreedVersion: consent.getAgreedVersion,
      status: consent.getStatus,
      grantedAt: consent.getGrantedAt,
      withdrawnAt: consent.getWithdrawnAt,
    });
    return consent;
  }
}
