import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CursorQueryDto } from "src/shared/pagination/cursor-query.dto";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";

export class ListAdoptionApplicationsQueryDto extends CursorQueryDto {
  @ApiPropertyOptional({
    enum: AdoptionApplicationStatus,
    description: "상태 필터 (생략 시 전체)",
  })
  @IsOptional()
  @IsEnum(AdoptionApplicationStatus)
  status?: AdoptionApplicationStatus;
}
