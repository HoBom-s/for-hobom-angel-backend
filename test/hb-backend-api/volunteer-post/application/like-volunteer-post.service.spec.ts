import { NotFoundException } from "@nestjs/common";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { LikeVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/like-volunteer-post.service";

const post = () =>
  VolunteerPost.write({ authorId: UserId.generate(), body: "hi" });

const cmd = () => ({
  postId: VolunteerPostId.generate().toString(),
  userId: UserId.generate().toString(),
});

describe("LikeVolunteerPostService", () => {
  const build = (over: { found?: VolunteerPost | null } = {}) => {
    const queryPort = {
      findById: jest
        .fn()
        .mockResolvedValue(over.found === undefined ? post() : over.found),
    };
    const likePort = {
      add: jest.fn(),
      remove: jest.fn(),
      likedAmong: jest.fn(),
    };
    const persistencePort = {
      create: jest.fn(),
      remove: jest.fn(),
      adjustLikeCount: jest.fn(),
    };
    const service = new LikeVolunteerPostService(
      { run: (fn: () => Promise<unknown>) => fn() } as TransactionRunner,
      queryPort as never,
      likePort,
      persistencePort,
    );
    return { service, likePort, persistencePort };
  };

  it("404 when the post is missing", async () => {
    const { service } = build({ found: null });
    await expect(service.like(cmd())).rejects.toBeInstanceOf(NotFoundException);
  });

  it("adjusts +1 only when the like is newly added", async () => {
    const { service, likePort, persistencePort } = build();
    likePort.add.mockResolvedValueOnce(true);
    await service.like(cmd());
    expect(persistencePort.adjustLikeCount).toHaveBeenCalledWith(
      expect.any(VolunteerPostId),
      1,
    );

    persistencePort.adjustLikeCount.mockClear();
    likePort.add.mockResolvedValueOnce(false); // already liked
    await service.like(cmd());
    expect(persistencePort.adjustLikeCount).not.toHaveBeenCalled();
  });

  it("adjusts -1 only when a like was actually removed", async () => {
    const { service, likePort, persistencePort } = build();
    likePort.remove.mockResolvedValueOnce(true);
    await service.unlike(cmd());
    expect(persistencePort.adjustLikeCount).toHaveBeenCalledWith(
      expect.any(VolunteerPostId),
      -1,
    );

    persistencePort.adjustLikeCount.mockClear();
    likePort.remove.mockResolvedValueOnce(false); // wasn't liked
    await service.unlike(cmd());
    expect(persistencePort.adjustLikeCount).not.toHaveBeenCalled();
  });
});
