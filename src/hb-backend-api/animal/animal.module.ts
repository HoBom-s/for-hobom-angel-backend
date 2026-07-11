import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ShelterModule } from "src/hb-backend-api/shelter/shelter.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import { AnimalSchema } from "src/hb-backend-api/animal/domain/model/animal.schema";
import { AnimalPersistenceAdapter } from "src/hb-backend-api/animal/adapters/out/animal-persistence.adapter";
import { AnimalQueryAdapter } from "src/hb-backend-api/animal/adapters/out/animal-query.adapter";
import { AnimalRepositoryImpl } from "src/hb-backend-api/animal/infra/repositories/animal.repository.impl";
import { RegisterAnimalService } from "src/hb-backend-api/animal/application/use-cases/register-animal.service";
import { UpdateAnimalProfileService } from "src/hb-backend-api/animal/application/use-cases/update-animal-profile.service";

/**
 * Animal store. Owns the adoptable-animal roster and its lifecycle. Registration
 * requires a VERIFIED shelter and one of its staff (hence the ShelterModule and
 * UserModule query ports). Exposes persistence/query ports for the adoption and
 * foster flows, which drive the status transitions the aggregate owns.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnimalEntity.name, schema: AnimalSchema },
    ]),
    ShelterModule,
    UserModule,
  ],
  providers: [
    {
      provide: DIToken.AnimalModule.RegisterAnimalUseCase,
      useClass: RegisterAnimalService,
    },
    {
      provide: DIToken.AnimalModule.UpdateAnimalProfileUseCase,
      useClass: UpdateAnimalProfileService,
    },
    {
      provide: DIToken.AnimalModule.AnimalRepository,
      useClass: AnimalRepositoryImpl,
    },
    {
      provide: DIToken.AnimalModule.AnimalPersistencePort,
      useClass: AnimalPersistenceAdapter,
    },
    {
      provide: DIToken.AnimalModule.AnimalQueryPort,
      useClass: AnimalQueryAdapter,
    },
  ],
  exports: [
    DIToken.AnimalModule.RegisterAnimalUseCase,
    DIToken.AnimalModule.UpdateAnimalProfileUseCase,
    DIToken.AnimalModule.AnimalPersistencePort,
    DIToken.AnimalModule.AnimalQueryPort,
  ],
})
export class AnimalModule {}
