import { Global, Module } from "@nestjs/common";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";

@Global()
@Module({
  providers: [TransactionRunner],
  exports: [TransactionRunner],
})
export class TransactionModule {}
