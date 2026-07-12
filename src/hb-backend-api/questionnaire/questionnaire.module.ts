import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { QuestionnaireEntity } from "src/hb-backend-api/questionnaire/domain/model/questionnaire.entity";
import { QuestionnaireSchema } from "src/hb-backend-api/questionnaire/domain/model/questionnaire.schema";
import { QuestionnairePersistenceAdapter } from "src/hb-backend-api/questionnaire/adapters/out/questionnaire-persistence.adapter";
import { QuestionnaireQueryAdapter } from "src/hb-backend-api/questionnaire/adapters/out/questionnaire-query.adapter";
import { QuestionnaireRepositoryImpl } from "src/hb-backend-api/questionnaire/infra/repositories/questionnaire.repository.impl";
import { DefineQuestionnaireService } from "src/hb-backend-api/questionnaire/application/use-cases/define-questionnaire.service";
import { QuestionnaireController } from "src/hb-backend-api/questionnaire/adapters/in/questionnaire.controller";

/**
 * Shared survey store. A shelter defines one questionnaire per purpose (adoption,
 * foster); the adoption and foster modules consume {@link QuestionnaireQueryPort}
 * to validate an applicant's answers against the current form.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionnaireEntity.name, schema: QuestionnaireSchema },
    ]),
    UserModule,
  ],
  controllers: [QuestionnaireController],
  providers: [
    {
      provide: DIToken.QuestionnaireModule.DefineQuestionnaireUseCase,
      useClass: DefineQuestionnaireService,
    },
    {
      provide: DIToken.QuestionnaireModule.QuestionnaireRepository,
      useClass: QuestionnaireRepositoryImpl,
    },
    {
      provide: DIToken.QuestionnaireModule.QuestionnairePersistencePort,
      useClass: QuestionnairePersistenceAdapter,
    },
    {
      provide: DIToken.QuestionnaireModule.QuestionnaireQueryPort,
      useClass: QuestionnaireQueryAdapter,
    },
  ],
  exports: [
    DIToken.QuestionnaireModule.DefineQuestionnaireUseCase,
    DIToken.QuestionnaireModule.QuestionnaireQueryPort,
  ],
})
export class QuestionnaireModule {}
