import { UploadPurpose } from "src/hb-backend-api/media/domain/enums/upload-purpose.enum";

export interface CreateUploadUrlCommand {
  purpose: UploadPurpose;
  /** MIME type of the file to upload (must be an allowed image type). */
  contentType: string;
  /** The authenticated uploader (for audit / rate limiting). */
  uploaderId: string;
}

export interface CreateUploadUrlResult {
  /** Server-generated immutable key; the client submits this when saving. */
  objectKey: string;
  /** Short-lived presigned PUT URL to upload the bytes to. */
  uploadUrl: string;
  /** How long the upload URL is valid. */
  expiresInSeconds: number;
  /** Where the object will be served from once uploaded (CDN). */
  publicUrl: string;
}

/**
 * Issues a presigned direct-to-storage upload URL. The client PUTs the bytes to
 * the URL (never through this service), then submits the returned objectKey.
 */
export interface CreateUploadUrlUseCase {
  invoke(command: CreateUploadUrlCommand): Promise<CreateUploadUrlResult>;
}
