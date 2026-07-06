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
import { DiscordModule } from "src/shared/discord/discord.module";
import { TraceContext } from "src/shared/trace/trace.context";
import { TraceInterceptor } from "src/shared/trace/trace.interceptor";
import { AuditModule } from "src/hb-backend-api/audit/audit.module";
import { AuthModule } from "src/hb-backend-api/auth/auth.module";
import { HealthModule } from "src/hb-backend-api/health/health.module";
import { OutboxModule } from "src/hb-backend-api/outbox/outbox.module";
import { UserModule } from "src/hb-backend-api/user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB"),
      }),
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
  ],
  providers: [
    TraceContext,
    { provide: APP_INTERCEPTOR, useClass: TraceInterceptor },
  ],
})
export class AppModule {}
