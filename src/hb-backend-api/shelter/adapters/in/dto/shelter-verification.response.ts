import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { FacilityPhotoKind } from "src/hb-backend-api/shelter/domain/enums/facility-photo-kind.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterVerificationView } from "src/hb-backend-api/shelter/domain/ports/in/get-shelter-verification.use-case";

class DossierAddress {
  @ApiProperty()
  region: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  roadAddress: string;

  @ApiProperty({ enum: AddressVisibility })
  visibility: AddressVisibility;
}

class DossierPhoto {
  @ApiProperty()
  objectKey: string;

  @ApiProperty({ enum: FacilityPhotoKind })
  kind: FacilityPhotoKind;

  @ApiPropertyOptional({ nullable: true })
  caption: string | null;
}

class DossierSignal {
  @ApiProperty({
    description: "registryMatch | businessValid | nameMatch",
  })
  key: string;

  @ApiProperty({ enum: SignalStatus })
  status: SignalStatus;
}

class DossierRegistrant {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;
}

/** Operator's review dossier for a shelter's verification. */
export class ShelterVerificationResponse {
  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: ShelterStatus })
  status: ShelterStatus;

  @ApiProperty({ type: DossierAddress })
  address: DossierAddress;

  @ApiPropertyOptional({ nullable: true, description: "보호센터 등록번호" })
  registrationNumber: string | null;

  @ApiPropertyOptional({ nullable: true, description: "사업자/고유번호" })
  businessNumber: string | null;

  @ApiPropertyOptional({ type: DossierRegistrant, nullable: true })
  registrant: DossierRegistrant | null;

  @ApiProperty({ type: [DossierPhoto] })
  facilityPhotos: DossierPhoto[];

  @ApiPropertyOptional({
    type: [DossierSignal],
    nullable: true,
    description: "자동 검증 신호 (배지). 미수행 시 null",
  })
  verificationSignals: DossierSignal[] | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  signalsCheckedAt: Date | null;

  @ApiPropertyOptional({ nullable: true, description: "이전 반려 사유" })
  rejectionReason: string | null;

  public static from(
    shelter: Shelter,
    registrant: ShelterVerificationView["registrant"],
  ): ShelterVerificationResponse {
    const address = shelter.getAddress;
    const signals = shelter.getVerificationSignals;

    const dto = new ShelterVerificationResponse();
    dto.shelterId = shelter.getId.toString();
    dto.name = shelter.getName;
    dto.slug = shelter.getSlug.raw;
    dto.status = shelter.getStatus;
    dto.address = {
      region: address.getRegion,
      city: address.getCity,
      roadAddress: address.getRoadAddress,
      visibility: address.getVisibility,
    };
    dto.registrationNumber = shelter.getRegistrationNumber?.raw ?? null;
    dto.businessNumber = shelter.getBusinessNumber?.raw ?? null;
    dto.registrant = registrant;
    dto.facilityPhotos = shelter.getFacilityPhotos.map((p) => ({
      objectKey: p.getObjectKey,
      kind: p.getKind,
      caption: p.getCaption,
    }));
    dto.verificationSignals = signals
      ? [
          { key: "registryMatch", status: signals.registryMatch },
          { key: "businessValid", status: signals.businessValid },
          { key: "nameMatch", status: signals.nameMatch },
        ]
      : null;
    dto.signalsCheckedAt = signals?.checkedAt ?? null;
    dto.rejectionReason = shelter.getRejectionReason;
    return dto;
  }
}
