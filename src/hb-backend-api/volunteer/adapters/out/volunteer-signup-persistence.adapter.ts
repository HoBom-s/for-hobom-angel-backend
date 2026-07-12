import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerSignupPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-persistence.port";
import { VolunteerSignupRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-signup.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/volunteer/adapters/out/volunteer-signup.mapper";

@Injectable()
export class VolunteerSignupPersistenceAdapter implements VolunteerSignupPersistencePort {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerSignupRepository)
    private readonly repository: VolunteerSignupRepository,
  ) {}

  public async create(signup: VolunteerSignup): Promise<void> {
    await this.repository.insert(toInsertDoc(signup));
  }

  public async save(signup: VolunteerSignup): Promise<void> {
    await this.repository.update(
      signup.getId.raw,
      signup.getVersion,
      toMutablePatch(signup),
    );
  }
}
