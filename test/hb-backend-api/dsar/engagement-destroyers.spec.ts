import { Types } from "mongoose";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Destroyer } from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { ErasureContext } from "src/shared/erasure/erasure-context";
import { LikeDestroyer } from "src/hb-backend-api/volunteer-post/adapters/erasure/like.destroyer";
import { BookmarkDestroyer } from "src/hb-backend-api/volunteer-post/adapters/erasure/bookmark.destroyer";
import { FavoriteDestroyer } from "src/hb-backend-api/favorite/adapters/erasure/favorite.destroyer";

const ctx = ErasureContext.of("actor", null);
const subjectId = new Types.ObjectId().toString();

/** A model whose deleteMany reports `n` removed and countDocuments reports 0. */
const deleteModel = (n: number) => ({
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: n }),
  countDocuments: jest.fn().mockReturnValue({ exec: () => Promise.resolve(0) }),
});

describe("engagement destroyers", () => {
  describe("LikeDestroyer — hard-delete + likeCount repair", () => {
    const postA = new Types.ObjectId();
    const postB = new Types.ObjectId();

    const likeModel = (postIds: Types.ObjectId[]) => ({
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        session: jest.fn().mockReturnThis(),
        exec: () => Promise.resolve(postIds.map((postId) => ({ postId }))),
      }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: postIds.length }),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: () => Promise.resolve(0) }),
    });

    it("decrements likeCount on each liked post, then deletes the likes", async () => {
      const likes = likeModel([postA, postB]);
      const posts = { updateMany: jest.fn().mockResolvedValue({}) };
      const destroyer = new LikeDestroyer(likes as never, posts as never);

      const receipt = await destroyer.erase(subjectId, ctx);

      expect(receipt.disposition).toBe(Disposition.HARD_DELETE);
      expect(receipt.affected).toBe(2);

      const [filter, update] = posts.updateMany.mock.calls[0];
      expect((filter as { _id: { $in: Types.ObjectId[] } })._id.$in).toEqual([
        postA,
        postB,
      ]);
      expect(update).toEqual({ $inc: { likeCount: -1 } });
      // Repair must precede the delete — otherwise postIds are gone.
      expect(posts.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        likes.deleteMany.mock.invocationCallOrder[0],
      );
    });

    it("is a no-op when the subject liked nothing (idempotent re-run)", async () => {
      const likes = likeModel([]);
      const posts = { updateMany: jest.fn().mockResolvedValue({}) };
      const destroyer = new LikeDestroyer(likes as never, posts as never);

      const receipt = await destroyer.erase(subjectId, ctx);

      expect(receipt.affected).toBe(0);
      expect(posts.updateMany).not.toHaveBeenCalled();
      expect(likes.deleteMany).not.toHaveBeenCalled();
    });

    it("is heavy (isolated transaction) so decrement + delete commit atomically", () => {
      const destroyer = new LikeDestroyer(
        likeModel([]) as never,
        { updateMany: jest.fn() } as never,
      );
      expect(destroyer.rule.heavy).toBe(true);
    });
  });

  describe("BookmarkDestroyer / FavoriteDestroyer — plain hard-delete", () => {
    const cases = [
      {
        name: "BookmarkDestroyer",
        key: "volunteer-post.bookmarks",
        make: (m: ReturnType<typeof deleteModel>) =>
          new BookmarkDestroyer(m as never),
      },
      {
        name: "FavoriteDestroyer",
        key: "favorite.favorites",
        make: (m: ReturnType<typeof deleteModel>) =>
          new FavoriteDestroyer(m as never),
      },
    ];

    it.each(cases)(
      "$name deletes the subject's rows by userId and reports the count",
      async ({ make, key }) => {
        const model = deleteModel(5);
        const destroyer = make(model);

        const receipt = await destroyer.erase(subjectId, ctx);

        expect(destroyer.key).toBe(key);
        expect(receipt.disposition).toBe(Disposition.HARD_DELETE);
        expect(receipt.affected).toBe(5);
        const [filter] = model.deleteMany.mock.calls[0];
        expect((filter as { userId: unknown }).userId).toBeInstanceOf(
          Types.ObjectId,
        );
      },
    );

    it.each(cases)(
      "$name reports residual via countDocuments",
      async ({ make }) => {
        const model = deleteModel(0);
        expect(await make(model).verifyResidual(subjectId)).toBe(0);
        expect(model.countDocuments).toHaveBeenCalledTimes(1);
      },
    );
  });

  it("every engagement destroyer is ENGAGEMENT / HARD_DELETE", () => {
    const destroyers: Destroyer[] = [
      new LikeDestroyer(
        { find: jest.fn() } as never,
        { updateMany: jest.fn() } as never,
      ),
      new BookmarkDestroyer(deleteModel(0) as never),
      new FavoriteDestroyer(deleteModel(0) as never),
    ];
    for (const d of destroyers) {
      expect(d.rule.category).toBe(DataCategory.ENGAGEMENT);
      expect(d.rule.disposition).toBe(Disposition.HARD_DELETE);
    }
  });
});
