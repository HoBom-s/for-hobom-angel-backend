import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  RelistAnimalCommand,
  RelistAnimalUseCase,
} from "src/hb-backend-api/animal/domain/ports/in/relist-animal.use-case";

/**
 * Re-lists a RETURNED animal for adoption. Only the owning shelter's staff may
 * do it; the aggregate enforces the RETURNED -> AVAILABLE transition.
 */
@Injectable()
export class RelistAnimalService implements RelistAnimalUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: RelistAnimalCommand): Promise<void> {
    const animal = await this.animalQueryPort.findById(
      AnimalId.fromString(command.animalId),
    );
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor || !actor.canManageShelter(animal.getShelterId)) {
      throw new ForbiddenException("보호소 담당자만 재등록할 수 있어요.");
    }

    animal.relist();
    await this.animalPersistencePort.save(animal);
  }
}
