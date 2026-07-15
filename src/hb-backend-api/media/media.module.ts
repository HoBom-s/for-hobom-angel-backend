import { Module } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { R2StorageAdapter } from "src/hb-backend-api/media/adapters/out/r2-storage.adapter";
import { CreateUploadUrlService } from "src/hb-backend-api/media/application/use-cases/create-upload-url.service";
import { MediaController } from "src/hb-backend-api/media/adapters/in/media.controller";

/**
 * Media uploads. Issues presigned direct-to-storage (Cloudflare R2 / any
 * S3-compatible bucket) upload URLs; image bytes never pass through the app.
 * Objects are served via the CDN in front of the bucket.
 */
@Module({
  controllers: [MediaController],
  providers: [
    {
      provide: DIToken.MediaModule.ObjectStoragePort,
      useClass: R2StorageAdapter,
    },
    {
      provide: DIToken.MediaModule.CreateUploadUrlUseCase,
      useClass: CreateUploadUrlService,
    },
  ],
})
export class MediaModule {}
