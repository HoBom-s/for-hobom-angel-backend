import { SchemaFactory } from "@nestjs/mongoose";
import { PolicyDocumentEntity } from "src/hb-backend-api/policy/domain/model/policy-document.entity";

export const PolicyDocumentSchema =
  SchemaFactory.createForClass(PolicyDocumentEntity);

// Each version of a type is unique.
PolicyDocumentSchema.index({ type: 1, version: 1 }, { unique: true });
// "The current published version of this type" + the version history listing.
PolicyDocumentSchema.index({ type: 1, status: 1 });
