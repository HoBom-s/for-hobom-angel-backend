import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPostComment } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

const author = UserId.generate();
const postId = VolunteerPostId.generate();

const write = (body = "좋은 후기네요") =>
  VolunteerPostComment.write({ postId, authorId: author, body });

describe("VolunteerPostComment", () => {
  it("writes a comment owned by the author, trimming the body", () => {
    const c = write("  감사합니다  ");
    expect(c.getBody).toBe("감사합니다");
    expect(c.getPostId.toString()).toBe(postId.toString());
    expect(c.isAuthoredBy(author)).toBe(true);
    expect(c.isAuthoredBy(UserId.generate())).toBe(false);
  });

  it("rejects an empty or too-long body", () => {
    expect(() => write("   ")).toThrow("내용");
    expect(() => write("a".repeat(1001))).toThrow("1000자");
  });
});
