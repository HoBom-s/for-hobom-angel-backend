import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { HealthProfile } from "src/hb-backend-api/animal/domain/model/health-profile";
import { Traits } from "src/hb-backend-api/animal/domain/model/traits";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { UpdateAnimalProfileCommand } from "src/hb-backend-api/animal/domain/ports/in/update-animal-profile.use-case";
import { UpdateAnimalProfileUseCase } from "src/hb-backend-api/animal/domain/ports/in/update-animal-profile.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Edits an animal's display profile. Only staff/admin of the owning shelter may
 * edit; the aggregate is loaded first so authorization is checked against its
 * actual owner, not a client-supplied shelterId.
 */
@Injectable()
export class UpdateAnimalProfileService implements UpdateAnimalProfileUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: UpdateAnimalProfileCommand): Promise<void> {
    const animal = await this.animalQueryPort.findById(
      AnimalId.fromString(command.animalId),
    );
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.editedBy),
    );
    if (!actor || !actor.canManageShelter(animal.getShelterId)) {
      throw new ForbiddenException(
        "보호소 스태프만 동물 정보를 수정할 수 있어요.",
      );
    }

    animal.updateProfile({
      name: command.name,
      species: command.species,
      description: command.description,
      traits: Traits.of(command.traits),
      health: HealthProfile.of(command.health),
    });
    await this.animalPersistencePort.save(animal);
  }
}
