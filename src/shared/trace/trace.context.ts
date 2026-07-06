import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

interface TraceStore {
  traceId: string;
}

/**
 * Propagates the request-scoped `x-hobom-trace-id` through async call chains
 * via AsyncLocalStorage, so any layer (adapters, gRPC clients) can read it
 * without threading it through method signatures.
 */
@Injectable()
export class TraceContext {
  private readonly storage = new AsyncLocalStorage<TraceStore>();

  public run<T>(traceId: string, fn: () => T): T {
    return this.storage.run({ traceId }, fn);
  }

  public getTraceId(): string | undefined {
    return this.storage.getStore()?.traceId;
  }
}
