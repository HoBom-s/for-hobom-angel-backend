import { ApiProperty } from "@nestjs/swagger";
import { AdminStats } from "src/hb-backend-api/shelter-stats/domain/ports/in/get-admin-stats.use-case";

export class AdminStatsResponse {
  @ApiProperty({ description: "검증된 보호소 수" })
  verifiedShelters: number;

  @ApiProperty({ description: "활성 회원 수" })
  activeUsers: number;

  @ApiProperty({ description: "이번 달 가입" })
  thisMonthSignups: number;

  @ApiProperty({ description: "누적 입양 성사" })
  totalAdoptions: number;

  @ApiProperty({ description: "이번 달 입양 성사" })
  thisMonthAdoptions: number;

  @ApiProperty({ description: "처리 대기 신청 (입양+임보 PENDING)" })
  pendingApplications: number;

  public static from(stats: AdminStats): AdminStatsResponse {
    const dto = new AdminStatsResponse();
    dto.verifiedShelters = stats.verifiedShelters;
    dto.activeUsers = stats.activeUsers;
    dto.thisMonthSignups = stats.thisMonthSignups;
    dto.totalAdoptions = stats.totalAdoptions;
    dto.thisMonthAdoptions = stats.thisMonthAdoptions;
    dto.pendingApplications = stats.pendingApplications;
    return dto;
  }
}
