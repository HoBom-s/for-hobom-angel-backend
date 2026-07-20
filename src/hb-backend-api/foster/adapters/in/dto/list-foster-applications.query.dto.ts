import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CursorQueryDto } from "src/shared/pagination/cursor-query.dto";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";

export class ListFosterApplicationsQueryDto extends CursorQueryDto {
  @ApiPropertyOptional({
    enum: FosterApplicationStatus,
    description: "상태 필터 (생략 시 전체)",
  })
  @IsOptional()
  @IsEnum(FosterApplicationStatus)
  status?: FosterApplicationStatus;
}
