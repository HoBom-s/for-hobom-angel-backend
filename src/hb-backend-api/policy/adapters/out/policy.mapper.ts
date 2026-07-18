import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyDocumentEntity } from "src/hb-backend-api/policy/domain/model/policy-document.entity";

export function toDomain(doc: PolicyDocumentEntity): PolicyDocument {
  return PolicyDocument.reconstitute({
    id: String(doc._id),
    type: doc.type,
    version: doc.version,
    title: doc.title,
    content: doc.content,
    status: doc.status,
    effectiveDate: doc.effectiveDate,
    publishedAt: doc.publishedAt,
  });
}

export function toInsertDoc(
  document: PolicyDocument,
): Partial<PolicyDocumentEntity> {
  return {
    type: document.getType,
    version: document.getVersion,
    title: document.getTitle,
    content: document.getContent,
    status: document.getStatus,
    effectiveDate: document.getEffectiveDate,
    publishedAt: document.getPublishedAt,
  };
}
