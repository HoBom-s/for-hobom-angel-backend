import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Faq } from "src/hb-backend-api/faq/domain/model/faq";
import { FaqId } from "src/hb-backend-api/faq/domain/model/vo/faq-id.vo";
import { FaqQueryPort } from "src/hb-backend-api/faq/domain/ports/out/faq-query.port";
import { FaqRepository } from "src/hb-backend-api/faq/domain/repositories/faq.repository";
import { toDomain } from "src/hb-backend-api/faq/adapters/out/faq.mapper";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

@Injectable()
export class FaqQueryAdapter implements FaqQueryPort {
  constructor(
    @Inject(DIToken.FaqModule.FaqRepository)
    private readonly faqRepository: FaqRepository,
  ) {}

  public async findById(id: FaqId): Promise<Faq | null> {
    const doc = await this.faqRepository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByShelter(
    shelterId: ShelterId,
    limit: number,
  ): Promise<Faq[]> {
    const docs = await this.faqRepository.findByShelter(shelterId.raw, limit);
    return docs.map(toDomain);
  }
}
