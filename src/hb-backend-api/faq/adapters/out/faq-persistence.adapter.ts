import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Faq } from "src/hb-backend-api/faq/domain/model/faq";
import { FaqPersistencePort } from "src/hb-backend-api/faq/domain/ports/out/faq-persistence.port";
import { FaqRepository } from "src/hb-backend-api/faq/domain/repositories/faq.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/faq/adapters/out/faq.mapper";

@Injectable()
export class FaqPersistenceAdapter implements FaqPersistencePort {
  constructor(
    @Inject(DIToken.FaqModule.FaqRepository)
    private readonly faqRepository: FaqRepository,
  ) {}

  public async create(faq: Faq): Promise<Faq> {
    await this.faqRepository.insert(toInsertDoc(faq));
    return faq;
  }

  public async save(faq: Faq): Promise<void> {
    await this.faqRepository.update(
      faq.getId.raw,
      faq.getVersion,
      toMutablePatch(faq),
    );
  }

  public async remove(faq: Faq): Promise<void> {
    await this.faqRepository.deleteById(faq.getId.raw);
  }
}
