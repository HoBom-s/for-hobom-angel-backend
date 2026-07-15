import { ApiProperty } from "@nestjs/swagger";
import { ShelterReputation } from "src/hb-backend-api/review/domain/model/shelter-reputation";

export class ShelterReputationResponse {
  @ApiProperty()
  shelterId: string;

  @ApiProperty({ description: "후기 수" })
  reviewCount: number;

  @ApiProperty({ description: "평균 별점 (소수 1자리)" })
  average: number;

  @ApiProperty({
    description: "별점별 개수",
    example: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 10 },
  })
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;

  public static from(reputation: ShelterReputation): ShelterReputationResponse {
    const dto = new ShelterReputationResponse();
    dto.shelterId = reputation.shelterId;
    dto.reviewCount = reputation.reviewCount;
    dto.average = reputation.average;
    dto.distribution = reputation.distribution;
    return dto;
  }
}
