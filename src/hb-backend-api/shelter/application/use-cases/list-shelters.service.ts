import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ListSheltersUseCase } from "src/hb-backend-api/shelter/domain/ports/in/list-shelters.use-case";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";

@Injectable()
export class ListSheltersService implements ListSheltersUseCase {
  constructor(
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
  ) {}

  public invoke(params: {
    region?: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<Shelter>> {
    return this.shelterQueryPort.findVerified(params);
  }
}
