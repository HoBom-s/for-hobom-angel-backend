import { ConflictException } from "@nestjs/common";

/**
 * Thrown when a version-guarded update matches no document — the aggregate was
 * modified by someone else since it was loaded (lost-update prevention). The
 * caller should reload and retry.
 */
export class OptimisticLockException extends ConflictException {
  constructor(entity: string) {
    super(`${entity}이(가) 다른 곳에서 먼저 변경됐어요. 다시 시도해 주세요.`);
  }
}
