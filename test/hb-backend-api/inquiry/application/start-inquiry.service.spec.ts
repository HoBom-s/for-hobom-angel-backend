import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { PostMessageUseCase } from "src/hb-backend-api/messaging/domain/ports/in/post-message.use-case";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryPersistencePort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-persistence.port";
import { InquiryQueryPort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-query.port";
import { StartInquiryService } from "src/hb-backend-api/inquiry/application/use-cases/start-inquiry.service";

const shelterId = ShelterId.generate();
const animalId = "6a65ed6d9579767bbe907e0b";
const inquirerId = "6a65ed6d9579767bbe907e1c";
const animal = { getShelterId: shelterId } as unknown as Animal;
const activeUser = { isActive: () => true } as unknown as User;

const build = (opts: {
  animal?: Animal | null;
  user?: User | null;
  existing?: Inquiry | null;
}) => {
  const animalQueryPort = {
    findById: jest
      .fn()
      .mockResolvedValue("animal" in opts ? opts.animal : animal),
  } as unknown as jest.Mocked<AnimalQueryPort>;
  const userQueryPort = {
    findById: jest
      .fn()
      .mockResolvedValue("user" in opts ? opts.user : activeUser),
  } as unknown as jest.Mocked<UserQueryPort>;
  const inquiryQueryPort = {
    findByInquirerAndAnimal: jest.fn().mockResolvedValue(opts.existing ?? null),
  } as unknown as jest.Mocked<InquiryQueryPort>;
  const inquiryPersistencePort = {
    create: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<InquiryPersistencePort>;
  const postMessageUseCase = {
    invoke: jest.fn().mockResolvedValue({ messageId: "m1" }),
  } as unknown as jest.Mocked<PostMessageUseCase>;
  const shelterQueryPort = {
    findById: jest.fn().mockResolvedValue(null),
  } as never;
  const notifyUseCase = { notify: jest.fn() } as never;
  return {
    service: new StartInquiryService(
      animalQueryPort,
      userQueryPort,
      inquiryQueryPort,
      inquiryPersistencePort,
      postMessageUseCase,
      shelterQueryPort,
      notifyUseCase,
    ),
    inquiryPersistencePort,
    postMessageUseCase,
  };
};

const cmd = { inquirerId, animalId, message: "안녕하세요" };

describe("StartInquiryService", () => {
  it("creates a thread and posts the first message when none exists", async () => {
    const { service, inquiryPersistencePort, postMessageUseCase } = build({});

    const { inquiryId } = await service.invoke(cmd);

    expect(inquiryId).toBeTruthy();
    expect(inquiryPersistencePort.create).toHaveBeenCalledTimes(1);
    expect(postMessageUseCase.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectType: MessageSubjectType.INQUIRY,
        subjectRef: inquiryId,
        senderId: inquirerId,
        body: "안녕하세요",
      }),
    );
  });

  it("reuses the existing thread on a repeat inquiry (no new thread)", async () => {
    const existing = Inquiry.reconstitute({
      id: Inquiry.open({
        shelterId,
        inquirerId: UserId.fromString(inquirerId),
      }).getId,
      shelterId,
      inquirerId: UserId.fromString(inquirerId),
      animalId: null,
      createdAt: null,
    });
    const { service, inquiryPersistencePort, postMessageUseCase } = build({
      existing,
    });

    const { inquiryId } = await service.invoke(cmd);

    expect(inquiryId).toBe(existing.getId.toString());
    expect(inquiryPersistencePort.create).not.toHaveBeenCalled();
    expect(postMessageUseCase.invoke).toHaveBeenCalledTimes(1);
  });

  it("404s when the animal does not exist", async () => {
    const { service } = build({ animal: null });
    await expect(service.invoke(cmd)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("forbids an inactive/absent member", async () => {
    const { service, postMessageUseCase } = build({ user: null });
    await expect(service.invoke(cmd)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(postMessageUseCase.invoke).not.toHaveBeenCalled();
  });
});
