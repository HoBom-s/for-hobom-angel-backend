import { Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { SubmitApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/submit-approval.use-case";
import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";
import { Address } from "src/hb-backend-api/shelter/domain/model/address";
import { FacilityPhoto } from "src/hb-backend-api/shelter/domain/model/facility-photo";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { VerificationSignals } from "src/hb-backend-api/shelter/domain/model/verification-signals";
import { BusinessNumber } from "src/hb-backend-api/shelter/domain/model/vo/business-number.vo";
import { ShelterRegistrationNumber } from "src/hb-backend-api/shelter/domain/model/vo/shelter-registration-number.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import {
  RegisterShelterCommand,
  RegisterShelterResult,
  RegisterShelterUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/register-shelter.use-case";
import { BusinessRegistryPort } from "src/hb-backend-api/shelter/domain/ports/out/business-registry.port";
import { PublicShelterDataPort } from "src/hb-backend-api/shelter/domain/ports/out/public-shelter-data.port";
import { ShelterPersistencePort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-persistence.port";

/**
 * Registers a shelter and opens its verification approval in ONE transaction.
 * Automated cross-checks (registry, business number) run first and are attached
 * to the shelter as decision-support signals — they never auto-approve; the
 * operator decides the SHELTER_VERIFICATION request. Because the shelter insert
 * and the approval submit share the transaction, a shelter is never left without
 * its pending review, and a failed submit rolls the shelter back.
 */
@Injectable()
export class RegisterShelterService implements RegisterShelterUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ShelterModule.ShelterPersistencePort)
    private readonly shelterPersistencePort: ShelterPersistencePort,
    @Inject(DIToken.ShelterModule.PublicShelterDataPort)
    private readonly publicShelterDataPort: PublicShelterDataPort,
    @Inject(DIToken.ShelterModule.BusinessRegistryPort)
    private readonly businessRegistryPort: BusinessRegistryPort,
    @Inject(DIToken.ApprovalModule.SubmitApprovalUseCase)
    private readonly submitApprovalUseCase: SubmitApprovalUseCase,
  ) {}

  @Transactional()
  public async invoke(
    command: RegisterShelterCommand,
  ): Promise<RegisterShelterResult> {
    const registrant = UserId.fromString(command.registrantId);
    const slug = ShelterSlug.of(command.slug);
    const address = Address.of(command.address);
    const registrationNumber = command.registrationNumber
      ? ShelterRegistrationNumber.of(command.registrationNumber)
      : null;
    const businessNumber = command.businessNumber
      ? BusinessNumber.of(command.businessNumber)
      : null;
    const facilityPhotos = (command.facilityPhotos ?? []).map((p) =>
      FacilityPhoto.of(p),
    );

    const signals = await this.runCrossChecks(
      registrationNumber,
      businessNumber,
    );

    const shelter = Shelter.register({
      name: command.name,
      slug,
      address,
      registrant,
      registrationNumber,
      businessNumber,
      facilityPhotos,
      verificationSignals: signals,
    });
    await this.shelterPersistencePort.create(shelter);

    const approvalId = await this.submitApprovalUseCase.invoke({
      type: ApprovalType.SHELTER_VERIFICATION,
      subjectRef: shelter.getId.toString(),
      requesterId: command.registrantId,
    });

    return {
      shelterId: shelter.getId.toString(),
      approvalId: approvalId.toString(),
    };
  }

  /**
   * Runs the automated evidence checks. An absent identifier or an unreachable
   * provider yields UNKNOWN, not FAIL — the operator then reviews manually.
   * `nameMatch` (document representative == registrant's verified real name) is
   * left to manual review for now; automating it needs an audited PII reveal.
   */
  private async runCrossChecks(
    registrationNumber: ShelterRegistrationNumber | null,
    businessNumber: BusinessNumber | null,
  ): Promise<VerificationSignals> {
    const registryMatch = registrationNumber
      ? (
          await this.publicShelterDataPort.verifyRegistration(
            registrationNumber,
          )
        ).status
      : SignalStatus.UNKNOWN;
    const businessValid = businessNumber
      ? await this.businessRegistryPort.verifyBusiness(businessNumber)
      : SignalStatus.UNKNOWN;

    return {
      registryMatch,
      businessValid,
      nameMatch: SignalStatus.UNKNOWN,
      checkedAt: new Date(),
    };
  }
}
