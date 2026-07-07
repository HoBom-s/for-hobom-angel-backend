/** Append-only actions recorded against a request — its event-sourced history. */
export enum ApprovalActionType {
  SUBMIT = "SUBMIT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  CANCEL = "CANCEL",
}
