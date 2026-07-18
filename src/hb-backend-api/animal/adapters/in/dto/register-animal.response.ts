import { ApiProperty } from "@nestjs/swagger";

export class RegisterAnimalResponse {
  @ApiProperty()
  animalId: string;
}
