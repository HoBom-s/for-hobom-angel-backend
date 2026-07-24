import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CursorQueryDto } from "src/shared/pagination/cursor-query.dto";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";

export class ListPendingApprovalsQueryDto extends CursorQueryDto {
  @ApiPropertyOptional({
    enum: ApprovalType,
    description: "유형 필터 (생략 시 전체)",
  })
  @IsOptional()
  @IsEnum(ApprovalType)
  type?: ApprovalType;
}
