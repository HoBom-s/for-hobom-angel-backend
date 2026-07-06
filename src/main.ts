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

  app.enableShutdownHooks();

  // gRPC outbox service — only wired once the Angel outbox proto is present.
  const grpcOptions = buildGrpcOptions();
  if (grpcOptions) {
    app.connectMicroservice(grpcOptions);
    await app.startAllMicroservices();
  }

  const port = Number(process.env.HOBOM_ANGEL_BACKEND_PORT ?? 8080);
  await app.listen(port);
}

void bootstrap();
