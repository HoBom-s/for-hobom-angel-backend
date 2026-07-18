import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignupId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-signup-id.vo";
import { SignupDecision } from "src/hb-backend-api/volunteer/domain/ports/in/decide-volunteer-signup.use-case";
import { DecideVolunteerSignupService } from "src/hb-backend-api/volunteer/application/use-cases/decide-volunteer-signup.service";

const pendingSignup = () =>
  VolunteerSignup.reconstitute({
    id: VolunteerSignupId.generate(),
    eventId: VolunteerEventId.generate(),
    volunteerId: UserId.generate(),
    status: VolunteerSignupStatus.PENDING,
    version: 0,
  });

const staff = (canManage: boolean) =>
  ({ canManageShelter: jest.fn().mockReturnValue(canManage) }) as never;

describe("DecideVolunteerSignupService", () => {
  const build = (
    over: { signup?: VolunteerSignup | null; canManage?: boolean } = {},
  ) => {
    const signup = over.signup === undefined ? pendingSignup() : over.signup;
    const event = {
      getShelterId: { toString: () => "shelter-1" },
      releaseSlot: jest.fn(),
    };
    const signupPersistencePort = { create: jest.fn(), save: jest.fn() };
    const eventPersistencePort = { create: jest.fn(), save: jest.fn() };
    const userQueryPort = {
      findById: jest.fn().mockResolvedValue(staff(over.canManage ?? true)),
    } as unknown as UserQueryPort;
    const service = new DecideVolunteerSignupService(
      { run: (fn: () => Promise<unknown>) => fn() } as TransactionRunner,
      {
        findById: jest.fn().mockResolvedValue(signup),
        findLive: jest.fn(),
        findByEvent: jest.fn(),
        findLiveByVolunteer: jest.fn(),
        findByVolunteer: jest.fn(),
        findApprovedByVolunteer: jest.fn(),
      },
      signupPersistencePort,
      { findById: jest.fn().mockResolvedValue(event) } as never,
      eventPersistencePort,
      userQueryPort,
    );
    return {
      service,
      signup,
      event,
      signupPersistencePort,
      eventPersistencePort,
    };
  };

  const decide = (decision: SignupDecision) => ({
    signupId: VolunteerSignupId.generate().toString(),
    actorId: UserId.generate().toString(),
    decision,
  });

  it("approves: signup APPROVED, slot kept", async () => {
    const { service, signup, event, signupPersistencePort } = build();
    await service.invoke(decide(SignupDecision.APPROVE));
    expect(signup?.getStatus).toBe(VolunteerSignupStatus.APPROVED);
    expect(signupPersistencePort.save).toHaveBeenCalledWith(signup);
    expect(event.releaseSlot).not.toHaveBeenCalled();
  });

  it("rejects: signup REJECTED and the event slot is freed", async () => {
    const { service, signup, event, eventPersistencePort } = build();
    await service.invoke(decide(SignupDecision.REJECT));
    expect(signup?.getStatus).toBe(VolunteerSignupStatus.REJECTED);
    expect(event.releaseSlot).toHaveBeenCalled();
    expect(eventPersistencePort.save).toHaveBeenCalledWith(event);
  });

  it("forbids a non-staff actor", async () => {
    const { service } = build({ canManage: false });
    await expect(
      service.invoke(decide(SignupDecision.APPROVE)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("404 when the signup is missing", async () => {
    const { service } = build({ signup: null });
    await expect(
      service.invoke(decide(SignupDecision.APPROVE)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
