import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ObjectStoragePort } from "src/hb-backend-api/media/domain/ports/out/object-storage.port";

/**
 * Cloudflare R2 adapter (S3-compatible — the same code works for S3/MinIO by
 * swapping the endpoint/credentials). The client is built lazily so the app can
 * boot without R2 configured; a request then fails closed via `getOrThrow`.
 */
@Injectable()
export class R2StorageAdapter implements ObjectStoragePort {
  private s3?: S3Client;

  constructor(private readonly config: ConfigService) {}

  public presignUpload(params: {
    objectKey: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.getOrThrow<string>("HOBOM_R2_BUCKET"),
      Key: params.objectKey,
      ContentType: params.contentType,
    });
    return getSignedUrl(this.client(), command, {
      expiresIn: params.expiresInSeconds,
    });
  }

  public publicUrl(objectKey: string): string {
    const base = this.config
      .getOrThrow<string>("HOBOM_R2_PUBLIC_BASE_URL")
      .replace(/\/+$/, "");
    return `${base}/${objectKey}`;
  }

  private client(): S3Client {
    if (!this.s3) {
      this.s3 = new S3Client({
        region: "auto",
        endpoint: this.config.getOrThrow<string>("HOBOM_R2_ENDPOINT"),
        credentials: {
          accessKeyId: this.config.getOrThrow<string>("HOBOM_R2_ACCESS_KEY_ID"),
          secretAccessKey: this.config.getOrThrow<string>(
            "HOBOM_R2_SECRET_ACCESS_KEY",
          ),
        },
      });
    }
    return this.s3;
  }
}
