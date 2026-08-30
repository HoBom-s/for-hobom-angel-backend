import { randomUUID } from "crypto";
import { UploadPurpose } from "src/hb-backend-api/media/domain/enums/upload-purpose.enum";
import { InvalidInputError } from "src/shared/exception/domain-exception";

/** Allowed upload MIME types → file extension. Anything else is rejected. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PREFIX_BY_PURPOSE: Record<UploadPurpose, string> = {
  [UploadPurpose.ANIMAL]: "animals",
  [UploadPurpose.SHELTER]: "shelters",
  [UploadPurpose.USER]: "users",
};

export function isAllowedImageType(contentType: string): boolean {
  return contentType in ALLOWED_IMAGE_TYPES;
}

/**
 * Builds an immutable, collision-free object key: `<prefix>/<uuid>.<ext>`. The
 * key is server-generated (never client-supplied) to prevent path traversal and
 * to make objects safely cacheable forever (a new upload = a new key).
 */
export function buildObjectKey(
  purpose: UploadPurpose,
  contentType: string,
): string {
  const ext = ALLOWED_IMAGE_TYPES[contentType];
  if (!ext) {
    throw new InvalidInputError(
      `허용되지 않은 이미지 형식이에요: ${contentType}`,
    );
  }
  return `${PREFIX_BY_PURPOSE[purpose]}/${randomUUID()}.${ext}`;
}
