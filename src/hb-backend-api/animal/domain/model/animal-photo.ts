/**
 * A public animal photo. Stored as an object key only — the bytes live in object
 * storage, uploaded and EXIF-stripped by the separate image server. Immutable.
 */
export class AnimalPhoto {
  constructor(
    private readonly objectKey: string,
    private readonly caption: string | null,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    objectKey: string;
    caption?: string | null;
  }): AnimalPhoto {
    if (!params.objectKey?.trim()) {
      throw new Error("사진 object key가 필요해요.");
    }
    return new AnimalPhoto(
      params.objectKey.trim(),
      params.caption?.trim() || null,
    );
  }

  public hasKey(objectKey: string): boolean {
    return this.objectKey === objectKey;
  }

  public toPlain(): { objectKey: string; caption?: string } {
    return { objectKey: this.objectKey, caption: this.caption ?? undefined };
  }

  public get getObjectKey(): string {
    return this.objectKey;
  }
  public get getCaption(): string | null {
    return this.caption;
  }
}
