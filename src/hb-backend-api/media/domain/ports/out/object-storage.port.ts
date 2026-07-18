/**
 * Write-side port over the object store (R2 / any S3-compatible bucket). The app
 * never proxies image bytes: it hands the client a short-lived presigned PUT URL
 * to upload directly, and later serves via the CDN in front of the bucket.
 */
export interface ObjectStoragePort {
  /** A presigned PUT URL the client uploads the bytes to, with this content type. */
  presignUpload(params: {
    objectKey: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string>;

  /** The public (CDN) URL an object key is served from. */
  publicUrl(objectKey: string): string;
}
