import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

/**
 * A shelter's editable "소개(About)" profile, for prefilling the staff console
 * editor. Fields mirror EditShelterProfileDto; the header context (name/slug/
 * status) is included so the editor can render without a second call.
 */
export class ShelterProfileResponse {
  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: ShelterStatus })
  status: ShelterStatus;

  @ApiPropertyOptional({ nullable: true, description: "소개 (Markdown)" })
  intro: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  operatingSince: Date | null;

  @ApiPropertyOptional({ nullable: true, description: "대표자명" })
  representativeName: string | null;

  @ApiPropertyOptional({ nullable: true, description: "방문 안내 (Markdown)" })
  visitGuide: string | null;

  @ApiPropertyOptional({ nullable: true, description: "후원 안내 (Markdown)" })
  supportGuide: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "커버 이미지 object key",
  })
  coverImageKey: string | null;

  public static from(shelter: Shelter): ShelterProfileResponse {
    const profile = shelter.getProfile;

    const dto = new ShelterProfileResponse();
    dto.shelterId = shelter.getId.toString();
    dto.name = shelter.getName;
    dto.slug = shelter.getSlug.raw;
    dto.status = shelter.getStatus;
    dto.intro = profile.getIntro;
    dto.operatingSince = profile.getOperatingSince;
    dto.representativeName = profile.getRepresentativeName;
    dto.visitGuide = profile.getVisitGuide;
    dto.supportGuide = profile.getSupportGuide;
    dto.coverImageKey = profile.getCoverImageKey;
    return dto;
  }
}
