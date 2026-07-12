import { ApiProperty } from "@nestjs/swagger";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";

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

  public static from(event: VolunteerEvent): VolunteerEventResponse {
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
    return dto;
  }
}
