import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";

export class TerminateFosterDto {
  @ApiProperty({ enum: FosterEndReason })
  @IsEnum(FosterEndReason)
  reason: FosterEndReason;
}
