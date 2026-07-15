import { ApiProperty } from "@nestjs/swagger";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";

/** One applicant row in an event's staff review list. */
export class VolunteerApplicantResponse {
  @ApiProperty()
  signupId: string;

  @ApiProperty()
  volunteerId: string;

  @ApiProperty({ enum: VolunteerSignupStatus })
  status: VolunteerSignupStatus;

  public static from(signup: VolunteerSignup): VolunteerApplicantResponse {
    const dto = new VolunteerApplicantResponse();
    dto.signupId = signup.getId.toString();
    dto.volunteerId = signup.getVolunteerId.toString();
    dto.status = signup.getStatus;
    return dto;
  }
}
