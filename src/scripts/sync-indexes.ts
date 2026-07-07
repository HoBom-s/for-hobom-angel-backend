import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { AppModule } from "src/app.module";

/**
 * Applies every Mongoose schema's declared indexes to the database.
 * `syncIndexes()` makes the DB match the schema (creates missing, drops
 * orphaned), so the SCHEMA is the single source of truth for indexes — no
 * hand-written index migration to drift out of sync.
 *
 * Production runs with autoIndex off, so this is the deploy step that builds
 * indexes:  npm run build && npm run indexes:sync
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger("SyncIndexes");
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });
  try {
    const connection = app.get<Connection>(getConnectionToken());
    const names = Object.keys(connection.models);
    for (const name of names) {
      await connection.models[name].syncIndexes();
      logger.log(`synced indexes: ${name}`);
    }
    logger.log(`done — ${names.length} collection(s)`);
  } finally {
    await app.close();
  }
}

void bootstrap();
