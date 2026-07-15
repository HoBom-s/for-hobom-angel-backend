import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import {
  CreateUploadUrlCommand,
  CreateUploadUrlResult,
  CreateUploadUrlUseCase,
} from "src/hb-backend-api/media/domain/ports/in/create-upload-url.use-case";
import { ObjectStoragePort } from "src/hb-backend-api/media/domain/ports/out/object-storage.port";
import {
  buildObjectKey,
  isAllowedImageType,
} from "src/hb-backend-api/media/domain/model/upload-key";

/** Presigned upload URLs are short-lived: enough to start an upload, not to hoard. */
const UPLOAD_URL_TTL_SECONDS = 300;

@Injectable()
export class CreateUploadUrlService implements CreateUploadUrlUseCase {
  constructor(
    @Inject(DIToken.MediaModule.ObjectStoragePort)
    private readonly objectStoragePort: ObjectStoragePort,
  ) {}

  public async invoke(
    command: CreateUploadUrlCommand,
  ): Promise<CreateUploadUrlResult> {
    if (!isAllowedImageType(command.contentType)) {
      throw new BadRequestException(
        `허용되지 않은 이미지 형식이에요: ${command.contentType}`,
      );
    }

    const objectKey = buildObjectKey(command.purpose, command.contentType);
    const uploadUrl = await this.objectStoragePort.presignUpload({
      objectKey,
      contentType: command.contentType,
      expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    });

    return {
      objectKey,
      uploadUrl,
      expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
      publicUrl: this.objectStoragePort.publicUrl(objectKey),
    };
  }
}
