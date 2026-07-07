import { FacilityPhotoKind } from "src/hb-backend-api/shelter/domain/enums/facility-photo-kind.enum";

/**
 * A public shelter facility photo (exterior/interior/…). Profile content that
 * also serves as a soft "this is a real place" signal during review. Stored as
 * an object key only (bytes live in object storage, EXIF stripped on upload so
 * GPS can't leak a hidden shelter's location).
 */
export class FacilityPhoto {
  constructor(
    private readonly objectKey: string,
    private readonly kind: FacilityPhotoKind,
    private readonly caption: string | null,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    objectKey: string;
    kind: FacilityPhotoKind;
    caption?: string | null;
  }): FacilityPhoto {
    if (!params.objectKey?.trim()) {
      throw new Error("사진 object key가 필요해요.");
    }
    return new FacilityPhoto(
      params.objectKey.trim(),
      params.kind,
      params.caption?.trim() || null,
    );
  }

  public hasKey(objectKey: string): boolean {
    return this.objectKey === objectKey;
  }

  public toPlain(): {
    objectKey: string;
    kind: FacilityPhotoKind;
    caption?: string;
  } {
    return {
      objectKey: this.objectKey,
      kind: this.kind,
      caption: this.caption ?? undefined,
    };
  }

  public get getObjectKey(): string {
    return this.objectKey;
  }
  public get getKind(): FacilityPhotoKind {
    return this.kind;
  }
  public get getCaption(): string | null {
    return this.caption;
  }
}
