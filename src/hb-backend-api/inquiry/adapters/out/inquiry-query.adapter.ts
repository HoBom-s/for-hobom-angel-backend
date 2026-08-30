import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { parseCursor, toCursorPage } from "src/shared/pagination/keyset";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryId } from "src/hb-backend-api/inquiry/domain/model/vo/inquiry-id.vo";
import { InquiryQueryPort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-query.port";
import { InquiryRepository } from "src/hb-backend-api/inquiry/domain/repositories/inquiry.repository";
import { toDomain } from "src/hb-backend-api/inquiry/adapters/out/inquiry.mapper";

@Injectable()
export class InquiryQueryAdapter implements InquiryQueryPort {
  constructor(
    @Inject(DIToken.InquiryModule.InquiryRepository)
    private readonly inquiryRepository: InquiryRepository,
  ) {}

  public async findById(id: InquiryId): Promise<Inquiry | null> {
    const doc = await this.inquiryRepository.findInquiryById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByInquirerAndAnimal(
    inquirerId: UserId,
    animalId: AnimalId,
  ): Promise<Inquiry | null> {
    const doc = await this.inquiryRepository.findOneByInquirerAndAnimal(
      inquirerId.raw,
      animalId.raw,
    );
    return doc ? toDomain(doc) : null;
  }

  public async findPageByInquirer(
    inquirerId: UserId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Inquiry>> {
    const cursorId = parseCursor(cursor);
    const docs = await this.inquiryRepository.findPageByInquirer(
      inquirerId.raw,
      cursorId,
      limit,
    );
    return toCursorPage(docs, limit, toDomain);
  }

  public async findPageByShelter(
    shelterId: ShelterId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Inquiry>> {
    const cursorId = parseCursor(cursor);
    const docs = await this.inquiryRepository.findPageByShelter(
      shelterId.raw,
      cursorId,
      limit,
    );
    return toCursorPage(docs, limit, toDomain);
  }
}
