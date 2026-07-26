import { UploadPurpose } from "src/hb-backend-api/media/domain/enums/upload-purpose.enum";
import {
  buildObjectKey,
  isAllowedImageType,
} from "src/hb-backend-api/media/domain/model/upload-key";

describe("upload-key", () => {
  it("allows only jpeg/png/webp", () => {
    expect(isAllowedImageType("image/jpeg")).toBe(true);
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/webp")).toBe(true);
    expect(isAllowedImageType("image/gif")).toBe(false);
    expect(isAllowedImageType("application/pdf")).toBe(false);
  });

  it("builds a prefixed, uuid-named, extension-correct key", () => {
    const key = buildObjectKey(UploadPurpose.ANIMAL, "image/jpeg");
    expect(key).toMatch(
      /^animals\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
    );
    expect(buildObjectKey(UploadPurpose.SHELTER, "image/png")).toMatch(
      /^shelters\/.+\.png$/,
    );
    expect(buildObjectKey(UploadPurpose.USER, "image/webp")).toMatch(
      /^users\/.+\.webp$/,
    );
  });

  it("generates a fresh key each call (immutable, collision-free)", () => {
    const a = buildObjectKey(UploadPurpose.ANIMAL, "image/jpeg");
    const b = buildObjectKey(UploadPurpose.ANIMAL, "image/jpeg");
    expect(a).not.toBe(b);
  });

  it("rejects a disallowed content type", () => {
    expect(() => buildObjectKey(UploadPurpose.ANIMAL, "image/gif")).toThrow(
      "허용되지 않은",
    );
  });
});
