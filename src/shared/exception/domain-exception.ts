/**
 * Framework-agnostic domain errors. The domain layer stays free of NestJS/HTTP
 * concerns and throws these to signal *why* an operation is invalid; the
 * {@link GlobalExceptionFilter} translates each `kind` to an HTTP status. Raw
 * `Error`s that escape (real bugs, infra failures) become a masked 500.
 */
export enum DomainErrorKind {
  /** The referenced entity does not exist → 404. */
  NOT_FOUND = "NOT_FOUND",

  /** The operation conflicts with current state / an invariant → 409. */
  CONFLICT = "CONFLICT",

  /** The caller-supplied input is malformed or fails a value rule → 400. */
  INVALID_INPUT = "INVALID_INPUT",
}

export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    public readonly kind: DomainErrorKind,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** The referenced entity was not found. Maps to 404. */
export class EntityNotFoundError extends DomainException {
  constructor(message: string) {
    super(message, DomainErrorKind.NOT_FOUND);
  }
}

/** The operation conflicts with the aggregate's current state. Maps to 409. */
export class BusinessRuleViolationError extends DomainException {
  constructor(message: string) {
    super(message, DomainErrorKind.CONFLICT);
  }
}

/** Caller-supplied input is malformed or fails a value-object rule. Maps to 400. */
export class InvalidInputError extends DomainException {
  constructor(message: string) {
    super(message, DomainErrorKind.INVALID_INPUT);
  }
}
