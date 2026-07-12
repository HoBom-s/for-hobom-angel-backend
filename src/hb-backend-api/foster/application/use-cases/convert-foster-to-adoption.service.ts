import {
  ConflictException,
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
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationPersistencePort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-persistence.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationPersistencePort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-persistence.port";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import {
  ConvertFosterToAdoptionCommand,
  ConvertFosterToAdoptionResult,
  ConvertFosterToAdoptionUseCase,
} from "src/hb-backend-api/foster/domain/ports/in/convert-foster-to-adoption.use-case";

/**
 * Converts an active foster into an adoption in one transaction: the foster ends
 * (CONVERTED_TO_ADOPTION), the animal moves FOSTERED -> ADOPTED, and an APPROVED
 * adoption is recorded for the fosterer. Only the owning shelter's staff may
 * finalize it (it is an adoption approval).
 */
@Injectable()
export class ConvertFosterToAdoptionService implements ConvertFosterToAdoptionUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly fosterQueryPort: FosterApplicationQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationPersistencePort)
    private readonly fosterPersistencePort: FosterApplicationPersistencePort,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.AnimalModule.AnimalPersistencePort)
    private readonly animalPersistencePort: AnimalPersistencePort,
    @Inject(DIToken.AdoptionModule.AdoptionApplicationPersistencePort)
    private readonly adoptionPersistencePort: AdoptionApplicationPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(
    command: ConvertFosterToAdoptionCommand,
  ): Promise<ConvertFosterToAdoptionResult> {
    const foster = await this.fosterQueryPort.findById(
      FosterApplicationId.fromString(command.fosterApplicationId),
    );
    if (!foster) {
      throw new NotFoundException("임시보호 신청을 찾을 수 없어요.");
    }
    if (!foster.isActiveFoster()) {
      throw new ConflictException("진행 중인 임시보호가 아니에요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor || !actor.canManageShelter(foster.getShelterId)) {
      throw new ForbiddenException("보호소 담당자만 전환할 수 있어요.");
    }

    const animal = await this.animalQueryPort.findById(foster.getAnimalId);
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }

    foster.convertToAdoption(new Date());
    await this.fosterPersistencePort.save(foster);

    animal.markAdopted();
    await this.animalPersistencePort.save(animal);

    const adoption = AdoptionApplication.convertedFromFoster({
      animalId: foster.getAnimalId,
      shelterId: foster.getShelterId,
      applicantId: foster.getApplicantId,
    });
    await this.adoptionPersistencePort.create(adoption);

    return { adoptionId: adoption.getId.toString() };
  }
}
