import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({ description: "댓글 내용" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body: string;
}
