import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { PostBlockType } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";

const author = UserId.generate();
const shelterId = ShelterId.generate();

const write = (over: Partial<Parameters<typeof VolunteerPost.write>[0]> = {}) =>
  VolunteerPost.write({
    authorId: author,
    shelterId,
    content: [{ type: PostBlockType.TEXT, text: "봉사 다녀왔어요!" }],
    ...over,
  });

describe("VolunteerPost", () => {
  it("writes a post owned by the author, about a shelter", () => {
    const post = write();
    expect(post.isAuthoredBy(author)).toBe(true);
    expect(post.isAuthoredBy(UserId.generate())).toBe(false);
    expect(post.getShelterId.toString()).toBe(shelterId.toString());
    expect(post.getEventId).toBeNull();
    expect(post.getImageKeys).toEqual([]);
  });

  it("keeps inline text/image blocks in order, with an optional event link", () => {
    const post = write({
      eventId: "  6a5794b48720b40bbfb76f7e  ",
      content: [
        { type: PostBlockType.TEXT, text: "산책 봉사" },
        { type: PostBlockType.IMAGE, imageKey: "a.webp", caption: "귀여워요" },
        { type: PostBlockType.TEXT, text: "즐거웠어요" },
      ],
    });
    expect(post.getEventId).toBe("6a5794b48720b40bbfb76f7e");
    expect(post.getContent.getBlocks).toHaveLength(3);
    expect(post.getContent.getBlocks[1]).toEqual({
      type: PostBlockType.IMAGE,
      imageKey: "a.webp",
      caption: "귀여워요",
    });
    // The image manifest is derived from image blocks, in order.
    expect(post.getImageKeys).toEqual(["a.webp"]);
  });

  it("rejects empty content and empty blocks", () => {
    expect(() => write({ content: [] })).toThrow("내용");
    expect(() =>
      write({ content: [{ type: PostBlockType.TEXT, text: "  " }] }),
    ).toThrow("텍스트");
    expect(() =>
      write({ content: [{ type: PostBlockType.IMAGE, imageKey: "  " }] }),
    ).toThrow("이미지");
  });
});
