import { ApiProperty } from "@nestjs/swagger";
import { AdopterHistory } from "src/hb-backend-api/adopter-history/domain/model/adopter-history";

export class AdopterHistoryResponse {
  @ApiProperty()
  userId: string;

  @ApiProperty({ description: "완료된 입양 수" })
  adoptions: number;

  @ApiProperty({ description: "파양/반환 수" })
  returns: number;

  @ApiProperty({ description: "임시보호 수" })
  fosters: number;

  @ApiProperty({ description: "계정 제재 여부" })
  sanctioned: boolean;

  public static from(history: AdopterHistory): AdopterHistoryResponse {
    const dto = new AdopterHistoryResponse();
    dto.userId = history.userId;
    dto.adoptions = history.adoptions;
    dto.returns = history.returns;
    dto.fosters = history.fosters;
    dto.sanctioned = history.sanctioned;
    return dto;
  }
}
