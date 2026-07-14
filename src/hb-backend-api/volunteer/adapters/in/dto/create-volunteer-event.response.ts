import { ApiProperty } from "@nestjs/swagger";

export class CreateVolunteerEventResponse {
  @ApiProperty()
  eventId: string;
}
