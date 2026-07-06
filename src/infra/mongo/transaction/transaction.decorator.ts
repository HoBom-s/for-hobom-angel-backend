import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";

interface HasTransactionRunner {
  readonly transactionRunner: TransactionRunner;
}

/**
 * Method decorator that wraps the call in a Mongo transaction. The host class
 * MUST expose `public readonly transactionRunner: TransactionRunner` (inject it
 * in the constructor):
 *
 *   constructor(public readonly transactionRunner: TransactionRunner, ...) {}
 *
 *   @Transactional()
 *   public async invoke(cmd: Cmd): Promise<void> { ... }
 */
export function Transactional(): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    const original = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    descriptor.value = function (
      this: HasTransactionRunner,
      ...args: unknown[]
    ): Promise<unknown> {
      if (!this.transactionRunner) {
        throw new Error(
          "@Transactional requires `transactionRunner: TransactionRunner` on the class instance",
        );
      }
      return this.transactionRunner.run(() => original.apply(this, args));
    };
    return descriptor;
  };
}
