import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { AdoptionApplicationPersistencePort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-persistence.port";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import {
  ReturnAdoptionCommand,
  ReturnAdoptionUseCase,
} from "src/hb-backend-api/adoption/domain/ports/in/return-adoption.use-case";

/**
 * Processes a return (파양/반환) of an approved adoption. Only the owning
 * shelter's staff may do it. The application (-> RETURNED, with reason) and the
 * animal (-> RETURNED) transition atomically; re-listing is a separate action.
 */
@Injectable()
export class ReturnAdoptionService implements ReturnAdoptionUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly applicationQueryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationPersistencePort)
    private readonly applicationPersistencePort: AdoptionApplicationPersistencePort,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: ReturnAdoptionCommand): Promise<void> {
    const application = await this.applicationQueryPort.findById(
      ApplicationId.fromString(command.adoptionId),
    );
    if (!application) {
      throw new NotFoundException("입양 내역을 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor || !actor.canManageShelter(application.getShelterId)) {
      throw new ForbiddenException("보호소 담당자만 반환을 처리할 수 있어요.");
    }

    const animal = await this.animalQueryPort.findById(application.getAnimalId);
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }

    application.markReturned(command.reason, new Date());
    await this.applicationPersistencePort.save(application);

    animal.markReturned();
    await this.animalPersistencePort.save(animal);
  }
}
