import { ApiProperty } from "@nestjs/swagger";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { AddressPublicView } from "src/hb-backend-api/shelter/domain/model/address";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

/** Public shelter view — the address is projected per its disclosure policy. */
export class ShelterResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: ShelterStatus })
  status: ShelterStatus;

  @ApiProperty({ enum: TrustTier, nullable: true })
  trustTier: TrustTier | null;

  @ApiProperty({ enum: AddressVisibility })
  addressVisibility: AddressVisibility;

  @ApiProperty()
  address: AddressPublicView;

  @ApiProperty({ type: [Object] })
  facilityPhotos: { objectKey: string; kind: string; caption?: string }[];

  @ApiProperty({
    nullable: true,
    description: "소개 본문 (Markdown, 항상 공개)",
  })
  intro: string | null;

  @ApiProperty({
    nullable: true,
    description: "운영 시작일 (ISO) — 클라이언트가 운영 연수 계산",
  })
  operatingSince: string | null;

  @ApiProperty({ nullable: true, description: "대표자 표기명" })
  representativeName: string | null;

  @ApiProperty({ nullable: true, description: "방문 안내 (Markdown)" })
  visitGuide: string | null;

  @ApiProperty({ nullable: true, description: "후원 안내 (Markdown)" })
  supportGuide: string | null;

  @ApiProperty({
    nullable: true,
    description: "마이크로사이트 커버(히어로) 이미지 object key",
  })
  coverImageKey: string | null;

  public static from(shelter: Shelter): ShelterResponse {
    const profile = shelter.getProfile;
    const dto = new ShelterResponse();
    dto.id = shelter.getId.toString();
    dto.name = shelter.getName;
    dto.slug = shelter.getSlug.raw;
    dto.status = shelter.getStatus;
    dto.trustTier = shelter.getTrustTier;
    dto.addressVisibility = shelter.getAddressVisibility;
    dto.address = shelter.getAddress.publicView();
    dto.facilityPhotos = shelter.getFacilityPhotos.map((p) => p.toPlain());
    dto.intro = profile.getIntro;
    dto.operatingSince = profile.getOperatingSince?.toISOString() ?? null;
    dto.representativeName = profile.getRepresentativeName;
    dto.visitGuide = profile.getVisitGuide;
    dto.supportGuide = profile.getSupportGuide;
    dto.coverImageKey = profile.getCoverImageKey;
    return dto;
  }
}
