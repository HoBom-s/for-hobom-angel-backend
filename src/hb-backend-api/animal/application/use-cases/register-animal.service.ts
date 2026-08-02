import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalPhoto } from "src/hb-backend-api/animal/domain/model/animal-photo";
import { HealthProfile } from "src/hb-backend-api/animal/domain/model/health-profile";
import { IntakeRecord } from "src/hb-backend-api/animal/domain/model/intake-record";
import { Traits } from "src/hb-backend-api/animal/domain/model/traits";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import {
  RegisterAnimalCommand,
  RegisterAnimalResult,
  RegisterAnimalUseCase,
} from "src/hb-backend-api/animal/domain/ports/in/register-animal.use-case";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Lists a new animal under a shelter. A shelter can only operate once VERIFIED
 * (the trust gate), and only its staff/admin may register — so both the shelter
 * and the actor are checked before the animal is created AVAILABLE.
 */
@Injectable()
export class RegisterAnimalService implements RegisterAnimalUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(
    command: RegisterAnimalCommand,
  ): Promise<RegisterAnimalResult> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }
    if (!shelter.isVerified()) {
      throw new ForbiddenException("검증된 보호소만 동물을 등록할 수 있어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.registeredBy),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 스태프만 동물을 등록할 수 있어요.");
    }

    const animal = Animal.register({
      shelterId,
      name: command.name,
      species: command.species,
      description: command.description,
      traits: Traits.of(command.traits),
      health: HealthProfile.of(command.health),
      intake: IntakeRecord.of(command.intake),
      photos: (command.photos ?? []).map((p) => AnimalPhoto.of(p)),
      eligiblePlacements: command.eligiblePlacements,
    });
    await this.animalPersistencePort.create(animal);

    return { animalId: animal.getId.toString() };
  }
}
