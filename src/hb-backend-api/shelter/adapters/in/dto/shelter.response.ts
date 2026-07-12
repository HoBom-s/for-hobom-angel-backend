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

  public static from(shelter: Shelter): ShelterResponse {
    const dto = new ShelterResponse();
    dto.id = shelter.getId.toString();
    dto.name = shelter.getName;
    dto.slug = shelter.getSlug.raw;
    dto.status = shelter.getStatus;
    dto.trustTier = shelter.getTrustTier;
    dto.addressVisibility = shelter.getAddressVisibility;
    dto.address = shelter.getAddress.publicView();
    dto.facilityPhotos = shelter.getFacilityPhotos.map((p) => p.toPlain());
    return dto;
  }
}
