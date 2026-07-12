import { ApiProperty } from "@nestjs/swagger";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

/** A map marker for a shelter. Coordinates follow the address disclosure policy. */
export class ShelterMarkerResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  lat: number;

  @ApiProperty()
  lng: number;

  public static from(shelter: Shelter): ShelterMarkerResponse {
    const view = shelter.getAddress.publicView();
    const dto = new ShelterMarkerResponse();
    dto.id = shelter.getId.toString();
    dto.name = shelter.getName;
    dto.slug = shelter.getSlug.raw;
    dto.region = view.region;
    dto.lat = view.lat as number;
    dto.lng = view.lng as number;
    return dto;
  }
}
