import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { randomUUID } from "crypto";
import { IncomingMessage } from "http";
import { LoggerModule } from "nestjs-pino";
import { TransactionModule } from "src/infra/mongo/transaction/transaction.module";
import { CryptoModule } from "src/shared/crypto/crypto.module";
import { validate } from "src/shared/config/env.validation";
import { buildMongooseOptions } from "src/shared/config/mongoose-options";
import { DiscordModule } from "src/shared/discord/discord.module";
import { HttpLogInterceptor } from "src/shared/observability/http-log.interceptor";
import { TraceContext } from "src/shared/trace/trace.context";
import { TraceInterceptor } from "src/shared/trace/trace.interceptor";
import { AdopterHistoryModule } from "src/hb-backend-api/adopter-history/adopter-history.module";
import { AdoptionModule } from "src/hb-backend-api/adoption/adoption.module";
import { AnimalModule } from "src/hb-backend-api/animal/animal.module";
import { AnnouncementModule } from "src/hb-backend-api/announcement/announcement.module";
import { ApprovalModule } from "src/hb-backend-api/approval/approval.module";
import { AuditModule } from "src/hb-backend-api/audit/audit.module";
import { FaqModule } from "src/hb-backend-api/faq/faq.module";
import { FavoriteModule } from "src/hb-backend-api/favorite/favorite.module";
import { FosterModule } from "src/hb-backend-api/foster/foster.module";
import { AuthModule } from "src/hb-backend-api/auth/auth.module";
import { HealthModule } from "src/hb-backend-api/health/health.module";
import { IdempotencyModule } from "src/hb-backend-api/idempotency/idempotency.module";
import { MediaModule } from "src/hb-backend-api/media/media.module";
import { ShelterStatsModule } from "src/hb-backend-api/shelter-stats/shelter-stats.module";
import { VolunteerPostModule } from "src/hb-backend-api/volunteer-post/volunteer-post.module";
import { MessagingModule } from "src/hb-backend-api/messaging/messaging.module";
import { OutboxModule } from "src/hb-backend-api/outbox/outbox.module";
import { QuestionnaireModule } from "src/hb-backend-api/questionnaire/questionnaire.module";
import { ReportModule } from "src/hb-backend-api/report/report.module";
import { ReviewModule } from "src/hb-backend-api/review/review.module";
import { ShelterModule } from "src/hb-backend-api/shelter/shelter.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { VolunteerModule } from "src/hb-backend-api/volunteer/volunteer.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: IncomingMessage) => {
          const header = req.headers["x-hobom-trace-id"];
          return (Array.isArray(header) ? header[0] : header) ?? randomUUID();
        },
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { singleLine: true } }
            : undefined,
        redact: ["req.headers.authorization", "req.headers.cookie"],
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildMongooseOptions,
    }),
    // Global infra
    TransactionModule,
    CryptoModule,
    DiscordModule,
    // Feature modules
    HealthModule,
    OutboxModule,
    UserModule,
    AuthModule,
    AuditModule,
    IdempotencyModule,
    ApprovalModule,
    ShelterModule,
    AnimalModule,
    QuestionnaireModule,
    MessagingModule,
    AdoptionModule,
    FosterModule,
    VolunteerModule,
    FavoriteModule,
    ReportModule,
    ReviewModule,
    AnnouncementModule,
    FaqModule,
    AdopterHistoryModule,
    MediaModule,
    ShelterStatsModule,
    VolunteerPostModule,
  ],
  providers: [
    TraceContext,
    // Order matters: trace id is bound first, then the access log can read it.
    { provide: APP_INTERCEPTOR, useClass: TraceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpLogInterceptor },
  ],
})
export class AppModule {}
