import { ApiProperty } from "@nestjs/swagger";

export class CreateUploadUrlResponse {
  @ApiProperty({ description: "저장/조회에 쓰는 불변 object key" })
  objectKey: string;

  @ApiProperty({
    description: "이 URL로 파일 바이트를 PUT (presign한 Content-Type 그대로)",
  })
  uploadUrl: string;

  @ApiProperty({ description: "uploadUrl 유효 시간(초)" })
  expiresInSeconds: number;

  @ApiProperty({ description: "업로드 후 CDN에서 서빙되는 공개 URL" })
  publicUrl: string;
}
