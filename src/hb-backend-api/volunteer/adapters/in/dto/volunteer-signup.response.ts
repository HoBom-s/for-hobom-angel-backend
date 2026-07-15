import { ApiProperty } from "@nestjs/swagger";

export class VolunteerSignupResponse {
  @ApiProperty()
  signupId: string;
}
