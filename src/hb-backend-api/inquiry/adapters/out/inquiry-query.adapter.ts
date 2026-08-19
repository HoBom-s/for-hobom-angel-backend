import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryEntity } from "src/hb-backend-api/inquiry/domain/model/inquiry.entity";
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

  public findPageByInquirer(
    inquirerId: UserId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Inquiry>> {
    return this.toPage(
      (cursorId) =>
        this.inquiryRepository.findPageByInquirer(
          inquirerId.raw,
          cursorId,
          limit,
        ),
      cursor,
      limit,
    );
  }

  public findPageByShelter(
    shelterId: ShelterId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Inquiry>> {
    return this.toPage(
      (cursorId) =>
        this.inquiryRepository.findPageByShelter(
          shelterId.raw,
          cursorId,
          limit,
        ),
      cursor,
      limit,
    );
  }

  private async toPage(
    fetch: (cursorId: Types.ObjectId | null) => Promise<InquiryEntity[]>,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Inquiry>> {
    const cursorId =
      cursor && Types.ObjectId.isValid(cursor)
        ? new Types.ObjectId(cursor)
        : null;
    const docs = await fetch(cursorId);
    const hasNext = docs.length > limit;
    const pageDocs = hasNext ? docs.slice(0, limit) : docs;
    const last = pageDocs[pageDocs.length - 1] as InquiryEntity | undefined;
    return {
      items: pageDocs.map(toDomain),
      hasNext,
      nextCursor: hasNext && last ? String(last._id) : null,
    };
  }
}
