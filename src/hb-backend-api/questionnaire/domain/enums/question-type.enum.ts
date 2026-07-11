/**
 * The closed set of question kinds. Choice types carry `options`; answers are
 * stored uniformly as a string list (a boolean as ["true"], a single choice as
 * one element, free text as one element).
 */
export enum QuestionType {
  TEXT = "TEXT",
  BOOLEAN = "BOOLEAN",
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTI_CHOICE = "MULTI_CHOICE",
}
