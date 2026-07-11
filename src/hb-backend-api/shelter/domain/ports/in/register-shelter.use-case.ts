import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { FacilityPhotoKind } from "src/hb-backend-api/shelter/domain/enums/facility-photo-kind.enum";

export interface RegisterShelterAddress {
  region: string;
  city: string;
  roadAddress: string;
  lat?: number;
  lng?: number;
  visibility: AddressVisibility;
}

export interface RegisterShelterPhoto {
  objectKey: string;
  kind: FacilityPhotoKind;
  caption?: string;
}

export interface RegisterShelterCommand {
  /** The registrant, who becomes the shelter's admin once verified. */
  registrantId: string;
  name: string;
  slug: string;
  address: RegisterShelterAddress;
  registrationNumber?: string;
  businessNumber?: string;
  facilityPhotos?: RegisterShelterPhoto[];
}

export interface RegisterShelterResult {
  shelterId: string;
  approvalId: string;
}

/**
 * Registers a shelter and opens its verification approval — one transaction. The
 * shelter starts PENDING_VERIFICATION and cannot operate until an operator
 * decides the {@link ApprovalType.SHELTER_VERIFICATION} request.
 */
export interface RegisterShelterUseCase {
  invoke(command: RegisterShelterCommand): Promise<RegisterShelterResult>;
}
