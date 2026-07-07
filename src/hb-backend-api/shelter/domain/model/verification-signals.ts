import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";

/**
 * The automated cross-check results attached to a pending shelter, shown to the
 * operator as decision support (green/amber/red). They never auto-approve; the
 * human makes the call. `nameMatch` (document/registry representative name ==
 * the registrant's verified real name) is the pivotal one.
 */
export interface VerificationSignals {
  /** 보호센터등록번호 vs national shelter dataset. */
  registryMatch: SignalStatus;
  /** 사업자/고유번호 authenticity (valid + not closed) via the tax office. */
  businessValid: SignalStatus;
  /** Document/registry representative name == registrant's CI real name. */
  nameMatch: SignalStatus;
  checkedAt: Date;
}
