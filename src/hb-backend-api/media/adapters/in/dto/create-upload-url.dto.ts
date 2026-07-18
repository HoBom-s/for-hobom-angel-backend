import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsIn, IsString } from "class-validator";
import { UploadPurpose } from "src/hb-backend-api/media/domain/enums/upload-purpose.enum";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class CreateUploadUrlDto {
  @ApiProperty({
    enum: UploadPurpose,
    description: "업로드 용도 (object key prefix 결정)",
  })
  @IsEnum(UploadPurpose)
  purpose: UploadPurpose;

  @ApiProperty({
    enum: ALLOWED_CONTENT_TYPES,
    description: "업로드할 파일의 MIME 타입",
  })
  @IsString()
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: string;
}
