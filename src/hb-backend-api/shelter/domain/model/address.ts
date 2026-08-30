import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { InvalidInputError } from "src/shared/exception/domain-exception";

export interface AddressPublicView {
  region: string;
  city?: string;
  roadAddress?: string;
  lat?: number;
  lng?: number;
}

/**
 * A shelter address with a built-in disclosure policy. `publicView()` returns
 * only what the chosen visibility allows, so the disclosure rule lives with the
 * data and can't be forgotten by a caller (§보호소 주소 공개 3단계).
 */
export class Address {
  constructor(
    private readonly region: string,
    private readonly city: string,
    private readonly roadAddress: string,
    private readonly lat: number | null,
    private readonly lng: number | null,
    private readonly visibility: AddressVisibility,
  ) {
    Object.freeze(this);
  }

  public static of(params: {
    region: string;
    city: string;
    roadAddress: string;
    lat?: number | null;
    lng?: number | null;
    visibility: AddressVisibility;
  }): Address {
    if (!params.region?.trim()) {
      throw new InvalidInputError("지역(시/도)이 필요해요.");
    }
    if (!params.roadAddress?.trim()) {
      throw new InvalidInputError("도로명 주소가 필요해요.");
    }
    return new Address(
      params.region.trim(),
      params.city?.trim() ?? "",
      params.roadAddress.trim(),
      params.lat ?? null,
      params.lng ?? null,
      params.visibility,
    );
  }

  /** The publicly visible projection, per the disclosure policy. */
  public publicView(): AddressPublicView {
    const coords =
      this.lat !== null && this.lng !== null
        ? { lat: this.lat, lng: this.lng }
        : {};
    switch (this.visibility) {
      case AddressVisibility.FULL:
        return {
          region: this.region,
          city: this.city,
          roadAddress: this.roadAddress,
          ...coords,
        };
      case AddressVisibility.PARTIAL:
        return { region: this.region, city: this.city, ...coords };
      case AddressVisibility.HIDDEN:
      default:
        return { region: this.region };
    }
  }

  /** Whether this shelter should appear on the map (coords disclosed). */
  public isMappable(): boolean {
    return (
      this.visibility !== AddressVisibility.HIDDEN &&
      this.lat !== null &&
      this.lng !== null
    );
  }

  public get getRegion(): string {
    return this.region;
  }
  public get getCity(): string {
    return this.city;
  }
  public get getRoadAddress(): string {
    return this.roadAddress;
  }
  public get getLat(): number | null {
    return this.lat;
  }
  public get getLng(): number | null {
    return this.lng;
  }
  public get getVisibility(): AddressVisibility {
    return this.visibility;
  }
}
