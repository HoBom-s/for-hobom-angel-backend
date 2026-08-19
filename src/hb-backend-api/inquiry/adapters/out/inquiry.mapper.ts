import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryEntity } from "src/hb-backend-api/inquiry/domain/model/inquiry.entity";
import { InquiryId } from "src/hb-backend-api/inquiry/domain/model/vo/inquiry-id.vo";

export function toDomain(doc: InquiryEntity): Inquiry {
  return Inquiry.reconstitute({
    id: InquiryId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    inquirerId: UserId.fromString(String(doc.inquirerId)),
    animalId: doc.animalId ? AnimalId.fromString(String(doc.animalId)) : null,
    createdAt: doc.createdAt ?? null,
  });
}

export function toInsertDoc(inquiry: Inquiry): Partial<InquiryEntity> {
  return {
    _id: inquiry.getId.raw,
    shelterId: inquiry.getShelterId.raw,
    inquirerId: inquiry.getInquirerId.raw,
    animalId: inquiry.getAnimalId ? inquiry.getAnimalId.raw : null,
  };
}
