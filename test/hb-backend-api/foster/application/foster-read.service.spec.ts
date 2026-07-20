import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { ListShelterFosterApplicationsService } from "src/hb-backend-api/foster/application/use-cases/list-shelter-foster-applications.service";
import { ListMyFosterApplicationsService } from "src/hb-backend-api/foster/application/use-cases/list-my-foster-applications.service";
import { GetFosterApplicationService } from "src/hb-backend-api/foster/application/use-cases/get-foster-application.service";

const applicantId = UserId.generate();
const shelterId = ShelterId.generate();

const anApplication = (): FosterApplication =>
  FosterApplication.submit({
    animalId: AnimalId.generate(),
    shelterId,
    applicantId,
    questionnaireVersion: 1,
    answers: [],
    plannedEndDate: null,
  });

const staff = (canManage: boolean) =>
  ({ canManageShelter: jest.fn().mockReturnValue(canManage) }) as never;

const emptyPage: Page<FosterApplication> = {
  items: [],
  nextCursor: null,
  hasNext: false,
};

const queryPortMock = () =>
  ({
    findById: jest.fn(),
    findPageByShelter: jest.fn().mockResolvedValue(emptyPage),
    findPageByApplicant: jest.fn().mockResolvedValue(emptyPage),
  }) as unknown as jest.Mocked<FosterApplicationQueryPort>;

const userPortMock = (canManage: boolean) =>
  ({
    findById: jest.fn().mockResolvedValue(staff(canManage)),
  }) as unknown as jest.Mocked<UserQueryPort>;

describe("ListShelterFosterApplicationsService", () => {
  it("rejects a caller who cannot manage the shelter", async () => {
    const service = new ListShelterFosterApplicationsService(
      queryPortMock(),
      userPortMock(false),
    );
    await expect(
      service.invoke({
        shelterId: shelterId.toString(),
        actorId: UserId.generate().toString(),
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns the shelter's page for a staff caller, passing the filters through", async () => {
    const queryPort = queryPortMock();
    const service = new ListShelterFosterApplicationsService(
      queryPort,
      userPortMock(true),
    );
    await service.invoke({
      shelterId: shelterId.toString(),
      actorId: UserId.generate().toString(),
      status: FosterApplicationStatus.PENDING,
      cursor: "c1",
      limit: 10,
    });
    expect(queryPort.findPageByShelter).toHaveBeenCalledWith(
      expect.any(ShelterId),
      FosterApplicationStatus.PENDING,
      "c1",
      10,
    );
  });
});

describe("ListMyFosterApplicationsService", () => {
  it("scopes the query to the caller's id", async () => {
    const queryPort = queryPortMock();
    const service = new ListMyFosterApplicationsService(queryPort);
    await service.invoke({ applicantId: applicantId.toString(), limit: 20 });
    expect(queryPort.findPageByApplicant).toHaveBeenCalledWith(
      expect.any(UserId),
      null,
      null,
      20,
    );
  });
});

describe("GetFosterApplicationService", () => {
  const build = (over: {
    app?: FosterApplication | null;
    canManage?: boolean;
  }) => {
    const queryPort = queryPortMock();
    queryPort.findById.mockResolvedValue(
      over.app === undefined ? anApplication() : over.app,
    );
    const userPort = userPortMock(over.canManage ?? false);
    return {
      queryPort,
      userPort,
      service: new GetFosterApplicationService(queryPort, userPort),
    };
  };

  it("throws NotFound when the application is missing", async () => {
    const { service } = build({ app: null });
    await expect(
      service.invoke({
        applicationId: UserId.generate().toString(),
        actorId: applicantId.toString(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lets the applicant read their own — without loading the actor", async () => {
    const app = anApplication();
    const { service, userPort } = build({ app });
    const result = await service.invoke({
      applicationId: app.getId.toString(),
      actorId: applicantId.toString(),
    });
    expect(result).toBe(app);
    expect(userPort.findById).not.toHaveBeenCalled();
  });

  it("lets owning-shelter staff read someone else's application", async () => {
    const app = anApplication();
    const { service } = build({ app, canManage: true });
    await expect(
      service.invoke({
        applicationId: app.getId.toString(),
        actorId: UserId.generate().toString(),
      }),
    ).resolves.toBe(app);
  });

  it("forbids a stranger who is neither owner nor staff", async () => {
    const app = anApplication();
    const { service } = build({ app, canManage: false });
    await expect(
      service.invoke({
        applicationId: app.getId.toString(),
        actorId: UserId.generate().toString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
