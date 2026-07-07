import { ConfigService } from "@nestjs/config";
import { MongooseModuleFactoryOptions } from "@nestjs/mongoose";

/**
 * Builds the Mongoose connection options.
 *
 * `autoIndex` is DISABLED in production: building indexes on app boot blocks
 * startup and can hammer a large collection. In production indexes are applied
 * explicitly via `npm run migrate:up` (a deploy step), keeping index changes
 * reviewed and controlled. In dev/test autoIndex stays on for convenience.
 */
export function buildMongooseOptions(
  config: ConfigService,
): MongooseModuleFactoryOptions {
  const isProduction = config.get<string>("NODE_ENV") === "production";
  return {
    uri: config.getOrThrow<string>("HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB"),
    autoIndex: !isProduction,
  };
}
