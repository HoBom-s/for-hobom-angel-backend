import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryPersistencePort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-persistence.port";
import { InquiryRepository } from "src/hb-backend-api/inquiry/domain/repositories/inquiry.repository";
import { toInsertDoc } from "src/hb-backend-api/inquiry/adapters/out/inquiry.mapper";

@Injectable()
export class InquiryPersistenceAdapter implements InquiryPersistencePort {
  constructor(
    @Inject(DIToken.InquiryModule.InquiryRepository)
    private readonly inquiryRepository: InquiryRepository,
  ) {}

  public async create(inquiry: Inquiry): Promise<void> {
    await this.inquiryRepository.insertInquiry(toInsertDoc(inquiry));
  }
}
