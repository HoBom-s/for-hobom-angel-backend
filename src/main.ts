// Must be first: boots the OTel SDK (when configured) before any instrumented
// module — http, express, mongoose, grpc — is required. See src/tracing.ts.
import "src/tracing";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "src/app.module";
import { buildGrpcOptions } from "src/infra/grpc/options.grpc";
import { DiscordWebhookService } from "src/shared/discord/discord-webhook.service";
import { GlobalExceptionFilter } from "src/shared/exception/global-exception.filter";
import { ResponseWrapInterceptor } from "src/shared/response/response-wrap.interceptor";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: (process.env.HOBOM_CORS_ORIGIN ?? "http://localhost:3001").split(
      ",",
    ),
    credentials: true,
  });
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseWrapInterceptor());
  app.useGlobalFilters(
    new GlobalExceptionFilter(app.get(DiscordWebhookService)),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("HoBom Angel Backend")
    .setDescription("HoBom Angel Universe API")
    .setVersion("0.1.0")
    .addCookieAuth("accessToken")
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    "api-docs",
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  // Drives the ordered shutdown (onModuleDestroy → onApplicationShutdown),
  // which closes the HTTP server + microservices, the Mongo connection, and
  // flushes OTel via TelemetryLifecycle. armShutdownWatchdog() guards against
  // a hook that never resolves.
  app.enableShutdownHooks();
  armShutdownWatchdog();

  // gRPC outbox service — only wired once the Angel outbox proto is present.
  const grpcOptions = buildGrpcOptions();
  if (grpcOptions) {
    app.connectMicroservice(grpcOptions);
    await app.startAllMicroservices();
  }

  const port = Number(process.env.HOBOM_ANGEL_BACKEND_PORT ?? 8080);
  await app.listen(port);
}

const SHUTDOWN_TIMEOUT_MS = Number(
  process.env.HOBOM_SHUTDOWN_TIMEOUT_MS ?? 15_000,
);

/**
 * Nest's shutdown hooks perform the graceful drain; this only backstops them.
 * If draining connections or flushing telemetry hangs past the deadline, force
 * a non-zero exit so an orchestrator (k8s) doesn't wait out its grace period.
 * The timer is `unref`'d so a clean, fast shutdown is never held open by it.
 */
function armShutdownWatchdog(): void {
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      setTimeout(() => {
        console.error(
          `[shutdown] graceful shutdown exceeded ${SHUTDOWN_TIMEOUT_MS}ms after ${signal}; forcing exit`,
        );
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS).unref();
    });
  }
}

void bootstrap();
