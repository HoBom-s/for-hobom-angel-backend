import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyQueryPort } from "src/hb-backend-api/policy/domain/ports/out/policy-query.port";
import { ConsentView } from "src/hb-backend-api/consent/domain/model/consent-view";
import { ConsentQueryPort } from "src/hb-backend-api/consent/domain/ports/out/consent-query.port";
import { ListMyConsentsUseCase } from "src/hb-backend-api/consent/domain/ports/in/list-my-consents.use-case";

/**
 * The caller's consent state for every policy type that has a published version,
 * joined with the current version so the client knows what still needs consent.
 */
@Injectable()
export class ListMyConsentsService implements ListMyConsentsUseCase {
  constructor(
    @Inject(DIToken.PolicyModule.PolicyQueryPort)
    private readonly policyQueryPort: PolicyQueryPort,
    @Inject(DIToken.ConsentModule.ConsentQueryPort)
    private readonly consentQueryPort: ConsentQueryPort,
  ) {}

  public async invoke(userId: string): Promise<ConsentView[]> {
    const consents = await this.consentQueryPort.findByUser(userId);

    const views: ConsentView[] = [];
    for (const policyType of Object.values(PolicyType)) {
      const current = await this.policyQueryPort.findCurrent(policyType);
      if (!current) {
        continue; // no published policy of this type → nothing to consent to
      }
      const consent = consents.find((c) => c.getPolicyType === policyType);
      const granted = consent?.isGranted() ?? false;
      const agreedVersion = granted
        ? (consent?.getAgreedVersion ?? null)
        : null;
      views.push({
        policyType,
        currentVersion: current.getVersion,
        agreedVersion,
        status: consent?.getStatus ?? "NONE",
        needsConsent:
          agreedVersion === null || agreedVersion < current.getVersion,
      });
    }
    return views;
  }
}
