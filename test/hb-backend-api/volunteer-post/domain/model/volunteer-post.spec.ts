import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";

const author = UserId.generate();

const write = (over: Partial<Parameters<typeof VolunteerPost.write>[0]> = {}) =>
  VolunteerPost.write({ authorId: author, body: "봉사 다녀왔어요!", ...over });

describe("VolunteerPost", () => {
  it("writes a post owned by the author, trimming the body", () => {
    const post = write({ body: "  좋은 하루  " });
    expect(post.getBody).toBe("좋은 하루");
    expect(post.isAuthoredBy(author)).toBe(true);
    expect(post.isAuthoredBy(UserId.generate())).toBe(false);
    expect(post.getEventId).toBeNull();
    expect(post.getImageKeys).toEqual([]);
  });

  it("keeps an optional event link and image keys", () => {
    const post = write({
      eventId: "  6a5794b48720b40bbfb76f7e  ",
      imageKeys: ["a.webp", "b.webp"],
    });
    expect(post.getEventId).toBe("6a5794b48720b40bbfb76f7e");
    expect(post.getImageKeys).toEqual(["a.webp", "b.webp"]);
  });

  it("rejects an empty body and too many images", () => {
    expect(() => write({ body: "   " })).toThrow("내용");
    expect(() =>
      write({ imageKeys: Array.from({ length: 11 }, (_, i) => `${i}.webp`) }),
    ).toThrow("이미지");
  });

  it("returns defensive copies of image keys", () => {
    const post = write({ imageKeys: ["a.webp"] });
    post.getImageKeys.push("b.webp");
    expect(post.getImageKeys).toEqual(["a.webp"]);
  });
});
