import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";

/**
 * Runs a unit of work inside a Mongo transaction. The session is bound to
 * {@link MongoSessionContext} for the duration so repositories pick it up
 * automatically. Requires a replica set / Atlas.
 */
@Injectable()
export class TransactionRunner {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  public async run<T>(fn: () => Promise<T>): Promise<T> {
    const session = await this.conn.startSession();
    try {
      return await session.withTransaction(() =>
        MongoSessionContext.runWithSession(session, fn),
      );
    } finally {
      await session.endSession();
    }
  }
}
