import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerType } from "src/hb-backend-api/volunteer/domain/enums/volunteer-type.enum";
import { TransportDetails } from "src/hb-backend-api/volunteer/domain/model/vo/transport-details";
import { VolunteerEventView } from "src/hb-backend-api/volunteer/domain/ports/in/read-volunteer-events.use-case";

export class TransportResponse {
  @ApiProperty()
  departure: string;

  @ApiProperty()
  arrival: string;

  @ApiProperty()
  flightAt: Date;

  @ApiProperty({ type: [String], description: "동반 동물 ID 목록" })
  animalIds: string[];

  @ApiProperty({ description: "동반 동물 수" })
  animalCount: number;

  @ApiProperty({ nullable: true })
  qualification: string | null;

  public static from(transport: TransportDetails): TransportResponse {
    const dto = new TransportResponse();
    dto.departure = transport.getDeparture;
    dto.arrival = transport.getArrival;
    dto.flightAt = transport.getFlightAt;
    dto.animalIds = transport.getAnimalIds.map((id) => id.toString());
    dto.animalCount = transport.getAnimalCount;
    dto.qualification = transport.getQualification;
    return dto;
  }
}

export class VolunteerEventResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  startAt: Date;

  @ApiProperty()
  endAt: Date;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  signedUpCount: number;

  @ApiProperty({ enum: VolunteerEventStatus })
  status: VolunteerEventStatus;

  @ApiProperty({ enum: VolunteerType })
  type: VolunteerType;

  @ApiPropertyOptional({
    type: TransportResponse,
    nullable: true,
    description: "OVERSEAS 이동봉사에만 존재",
  })
  transport: TransportResponse | null;

  @ApiProperty({
    nullable: true,
    description: "내 신청 ID (없으면 null — 이 값으로 철회)",
  })
  mySignupId: string | null;

  @ApiProperty({
    enum: VolunteerSignupStatus,
    nullable: true,
    description: "내 신청 상태 (PENDING/APPROVED, 없으면 null)",
  })
  mySignupStatus: VolunteerSignupStatus | null;

  public static from(view: VolunteerEventView): VolunteerEventResponse {
    const event = view.event;
    const dto = new VolunteerEventResponse();
    dto.id = event.getId.toString();
    dto.shelterId = event.getShelterId.toString();
    dto.title = event.getTitle;
    dto.description = event.getDescription;
    dto.startAt = event.getStartAt;
    dto.endAt = event.getEndAt;
    dto.capacity = event.getCapacity;
    dto.signedUpCount = event.getSignedUpCount;
    dto.status = event.getStatus;
    dto.type = event.getType;
    const transport = event.getTransport;
    dto.transport = transport ? TransportResponse.from(transport) : null;
    dto.mySignupId = view.mySignupId;
    dto.mySignupStatus = view.mySignupStatus;
    return dto;
  }
}
