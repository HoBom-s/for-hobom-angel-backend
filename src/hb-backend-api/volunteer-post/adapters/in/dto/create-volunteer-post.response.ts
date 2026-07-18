import { ApiProperty } from "@nestjs/swagger";
import { CreateVolunteerPostResult } from "src/hb-backend-api/volunteer-post/domain/ports/in/create-volunteer-post.use-case";

export class CreateVolunteerPostResponse {
  @ApiProperty()
  postId: string;

  public static from(
    result: CreateVolunteerPostResult,
  ): CreateVolunteerPostResponse {
    const dto = new CreateVolunteerPostResponse();
    dto.postId = result.postId;
    return dto;
  }
}
