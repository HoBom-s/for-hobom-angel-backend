import { ApiProperty } from "@nestjs/swagger";
import { ShelterStats } from "src/hb-backend-api/animal/domain/ports/in/get-shelter-stats.use-case";

export class ShelterStatsResponse {
  @ApiProperty({ description: "누적 입양 수 (ADOPTED)" })
  adoptedCount: number;

  @ApiProperty({ description: "보호 중 수 (AVAILABLE + RESERVED + FOSTERED)" })
  shelteredCount: number;

  @ApiProperty({ description: "입양 가능 수 (AVAILABLE)" })
  availableCount: number;

  public static from(stats: ShelterStats): ShelterStatsResponse {
    const dto = new ShelterStatsResponse();
    dto.adoptedCount = stats.adoptedCount;
    dto.shelteredCount = stats.shelteredCount;
    dto.availableCount = stats.availableCount;
    return dto;
  }
}
