import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FaqEntity } from "src/hb-backend-api/faq/domain/model/faq.entity";
import { Faq } from "src/hb-backend-api/faq/domain/model/faq";
import { FaqId } from "src/hb-backend-api/faq/domain/model/vo/faq-id.vo";
import { FaqMutablePatch } from "src/hb-backend-api/faq/domain/repositories/faq.repository";

/** Rehydrates a persisted document into the {@link Faq} aggregate. */
export function toDomain(doc: FaqEntity): Faq {
  return Faq.reconstitute({
    id: FaqId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    authorId: UserId.fromString(String(doc.authorId)),
    question: doc.question,
    answer: doc.answer,
    order: doc.order,
    createdAt: doc.createdAt ?? null,
    version: doc.version ?? 0,
  });
}

/** New-FAQ insert document (version/timestamps default in the schema). */
export function toInsertDoc(faq: Faq): Partial<FaqEntity> {
  return {
    _id: faq.getId.raw,
    shelterId: faq.getShelterId.raw,
    authorId: faq.getAuthorId.raw,
    question: faq.getQuestion,
    answer: faq.getAnswer,
    order: faq.getOrder,
  };
}

export function toMutablePatch(faq: Faq): FaqMutablePatch {
  return {
    question: faq.getQuestion,
    answer: faq.getAnswer,
    order: faq.getOrder,
  };
}
