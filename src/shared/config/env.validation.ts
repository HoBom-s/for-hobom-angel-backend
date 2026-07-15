import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from "class-validator";

export enum NodeEnv {
  Development = "development",
  Production = "production",
  Test = "test",
}

/**
 * The environment contract the service needs to boot correctly. Only the
 * genuinely-required variables are non-optional; feature-specific vars (Kafka,
 * Redis, image storage, verify provider…) are validated when the corresponding
 * modules land. Validation runs once at startup so a missing/blank secret fails
 * the process immediately instead of surfacing as a confusing runtime error.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV?: NodeEnv;

  @IsNotEmpty()
  @IsString()
  HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB: string;

  @IsNotEmpty()
  @IsString()
  HOBOM_JWT_SECRET: string;

  @IsNotEmpty()
  @IsString()
  HOBOM_JWT_REFRESH_SECRET: string;

  @IsNotEmpty()
  @IsString()
  HOBOM_JWT_ACCESS_TOKEN_EXPIRED: string;

  @IsNotEmpty()
  @IsString()
  HOBOM_JWT_REFRESH_TOKEN_EXPIRED: string;

  // Enforced as required in production below (dev may run without it).
  @IsOptional()
  @IsString()
  FIELD_ENCRYPTION_KEY?: string;

  // Shared secret the outbox relay (hobom-event-processor) presents as the
  // `x-api-key` gRPC header. Enforced as required in production below.
  @IsOptional()
  @IsString()
  HOBOM_GRPC_API_KEY?: string;
}

/**
 * ConfigModule `validate` hook. Throws (aborting boot) on an invalid env, and
 * returns the ORIGINAL config so undeclared feature vars are preserved for
 * ConfigService (validating a class instance would strip them).
 */
export function validate(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(parsed, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(", "))
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  if (parsed.NODE_ENV === NodeEnv.Production && !config.FIELD_ENCRYPTION_KEY) {
    throw new Error("FIELD_ENCRYPTION_KEY is required in production");
  }
  if (parsed.NODE_ENV === NodeEnv.Production && !config.HOBOM_GRPC_API_KEY) {
    throw new Error("HOBOM_GRPC_API_KEY is required in production");
  }
  return config;
}
