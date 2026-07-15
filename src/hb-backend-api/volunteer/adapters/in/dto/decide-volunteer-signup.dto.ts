import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { SignupDecision } from "src/hb-backend-api/volunteer/domain/ports/in/decide-volunteer-signup.use-case";

export class DecideVolunteerSignupDto {
  @ApiProperty({ enum: SignupDecision, description: "승인 또는 거절" })
  @IsEnum(SignupDecision)
  decision: SignupDecision;
}
