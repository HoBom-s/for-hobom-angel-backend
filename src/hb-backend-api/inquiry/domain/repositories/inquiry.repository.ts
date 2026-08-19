import { Types } from "mongoose";
import { InquiryEntity } from "src/hb-backend-api/inquiry/domain/model/inquiry.entity";

export interface InquiryRepository {
  insertInquiry(doc: Partial<InquiryEntity>): Promise<void>;
  findInquiryById(id: Types.ObjectId): Promise<InquiryEntity | null>;
  findOneByInquirerAndAnimal(
    inquirerId: Types.ObjectId,
    animalId: Types.ObjectId,
  ): Promise<InquiryEntity | null>;
  /** Newest-first keyset page of a member's inquiries (`_id < cursor`). */
  findPageByInquirer(
    inquirerId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<InquiryEntity[]>;
  /** Newest-first keyset page of a shelter's inquiries (`_id < cursor`). */
  findPageByShelter(
    shelterId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<InquiryEntity[]>;
}
