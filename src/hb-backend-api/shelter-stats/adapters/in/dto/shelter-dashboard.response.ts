import { ApiProperty } from "@nestjs/swagger";
import {
  MonthlyAdoptionPoint,
  ShelterDashboard,
} from "src/hb-backend-api/shelter-stats/domain/ports/in/get-shelter-dashboard.use-case";

export class MonthlyAdoptionPointResponse {
  @ApiProperty({ example: "2026-07", description: "YYYY-MM (KST)" })
  month: string;

  @ApiProperty()
  count: number;
}

export class ShelterDashboardResponse {
  @ApiProperty({ description: "누적 입양 (ADOPTED)" })
  adoptedCount: number;

  @ApiProperty({ description: "보호 중 (AVAILABLE+RESERVED+FOSTERED)" })
  shelteredCount: number;

  @ApiProperty({ description: "입양가능 (AVAILABLE)" })
  availableCount: number;

  @ApiProperty({ description: "입양율 = adopted/(adopted+sheltered), 0~1" })
  adoptionRate: number;

  @ApiProperty({ description: "이번 달 입양" })
  thisMonthAdoptions: number;

  @ApiProperty({ description: "지난달 입양" })
  lastMonthAdoptions: number;

  @ApiProperty({
    type: [MonthlyAdoptionPointResponse],
    description: "월별 입양 추이 (6개월)",
  })
  monthlyAdoptions: MonthlyAdoptionPointResponse[];

  @ApiProperty({ description: "처리 대기 신청 (입양+임보 PENDING)" })
  pendingApplications: number;

  public static from(dashboard: ShelterDashboard): ShelterDashboardResponse {
    const dto = new ShelterDashboardResponse();
    dto.adoptedCount = dashboard.adoptedCount;
    dto.shelteredCount = dashboard.shelteredCount;
    dto.availableCount = dashboard.availableCount;
    dto.adoptionRate = dashboard.adoptionRate;
    dto.thisMonthAdoptions = dashboard.thisMonthAdoptions;
    dto.lastMonthAdoptions = dashboard.lastMonthAdoptions;
    dto.monthlyAdoptions = dashboard.monthlyAdoptions.map(
      (point: MonthlyAdoptionPoint) => {
        const p = new MonthlyAdoptionPointResponse();
        p.month = point.month;
        p.count = point.count;
        return p;
      },
    );
    dto.pendingApplications = dashboard.pendingApplications;
    return dto;
  }
}
