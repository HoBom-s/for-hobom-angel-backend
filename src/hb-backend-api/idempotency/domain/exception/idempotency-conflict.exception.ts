import { ConflictException } from "@nestjs/common";

/** Thrown when a (scope, key) has already been reserved — the retry is a no-op. */
export class IdempotencyConflictException extends ConflictException {
  constructor(scope: string, key: string) {
    super(`이미 처리된 요청이에요. (${scope}:${key})`);
  }
}
