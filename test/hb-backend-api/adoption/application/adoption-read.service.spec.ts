import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { ListShelterAdoptionApplicationsService } from "src/hb-backend-api/adoption/application/use-cases/list-shelter-adoption-applications.service";
import { ListMyAdoptionApplicationsService } from "src/hb-backend-api/adoption/application/use-cases/list-my-adoption-applications.service";
import { GetAdoptionApplicationService } from "src/hb-backend-api/adoption/application/use-cases/get-adoption-application.service";

const applicantId = UserId.generate();
const shelterId = ShelterId.generate();

const anApplication = (): AdoptionApplication =>
  AdoptionApplication.submit({
    animalId: AnimalId.generate(),
    shelterId,
    applicantId,
    questionnaireVersion: 1,
    answers: [],
  });

const staff = (canManage: boolean) =>
  ({ canManageShelter: jest.fn().mockReturnValue(canManage) }) as never;

const emptyPage: Page<AdoptionApplication> = {
  items: [],
  nextCursor: null,
  hasNext: false,
};

const queryPortMock = () =>
  ({
    findById: jest.fn(),
    findPageByShelter: jest.fn().mockResolvedValue(emptyPage),
    findPageByApplicant: jest.fn().mockResolvedValue(emptyPage),
  }) as unknown as jest.Mocked<AdoptionApplicationQueryPort>;

const userPortMock = (canManage: boolean) =>
  ({
    findById: jest.fn().mockResolvedValue(staff(canManage)),
  }) as unknown as jest.Mocked<UserQueryPort>;

describe("ListShelterAdoptionApplicationsService", () => {
  it("rejects a caller who cannot manage the shelter", async () => {
    const service = new ListShelterAdoptionApplicationsService(
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
    const service = new ListShelterAdoptionApplicationsService(
      queryPort,
      userPortMock(true),
    );
    await service.invoke({
      shelterId: shelterId.toString(),
      actorId: UserId.generate().toString(),
      status: AdoptionApplicationStatus.PENDING,
      cursor: "c1",
      limit: 10,
    });
    expect(queryPort.findPageByShelter).toHaveBeenCalledWith(
      expect.any(ShelterId),
      AdoptionApplicationStatus.PENDING,
      "c1",
      10,
    );
  });
});

describe("ListMyAdoptionApplicationsService", () => {
  it("scopes the query to the caller's id", async () => {
    const queryPort = queryPortMock();
    const service = new ListMyAdoptionApplicationsService(queryPort);
    await service.invoke({ applicantId: applicantId.toString(), limit: 20 });
    expect(queryPort.findPageByApplicant).toHaveBeenCalledWith(
      expect.any(UserId),
      null,
      null,
      20,
    );
  });
});

describe("GetAdoptionApplicationService", () => {
  const build = (over: {
    app?: AdoptionApplication | null;
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
      service: new GetAdoptionApplicationService(queryPort, userPort),
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
