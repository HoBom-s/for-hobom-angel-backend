import { ApiProperty } from "@nestjs/swagger";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

/** A shelter card in the §04 directory list. Region only — no full address. */
export class ShelterListItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ description: "시/도 (지역 라벨)" })
  region: string;

  @ApiProperty({ enum: ShelterStatus })
  status: ShelterStatus;

  @ApiProperty({ enum: TrustTier, nullable: true })
  trustTier: TrustTier | null;

  @ApiProperty({ nullable: true, description: "커버 이미지 object key" })
  coverImageKey: string | null;

  public static from(shelter: Shelter): ShelterListItemResponse {
    const dto = new ShelterListItemResponse();
    dto.id = shelter.getId.toString();
    dto.name = shelter.getName;
    dto.slug = shelter.getSlug.raw;
    dto.region = shelter.getAddress.publicView().region;
    dto.status = shelter.getStatus;
    dto.trustTier = shelter.getTrustTier;
    dto.coverImageKey = shelter.getProfile.getCoverImageKey;
    return dto;
  }
}
