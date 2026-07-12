import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";

const post = (over: { title?: string; body?: string; pinned?: boolean } = {}) =>
  Announcement.post({
    shelterId: new ShelterId(new Types.ObjectId()),
    authorId: UserId.generate(),
    title: over.title ?? "정기 휴무 안내",
    body: over.body ?? "이번 주말은 휴무입니다.",
    pinned: over.pinned ?? false,
  });

describe("Announcement aggregate", () => {
  it("posts a notice, trimming fields and starting at version 0", () => {
    const a = post({ title: "  공지  ", body: "  내용  ", pinned: true });
    expect(a.getTitle).toBe("공지");
    expect(a.getBody).toBe("내용");
    expect(a.isPinned).toBe(true);
    expect(a.getVersion).toBe(0);
  });

  it("rejects an empty title or body", () => {
    expect(() => post({ title: "   " })).toThrow("제목");
    expect(() => post({ body: "   " })).toThrow("내용");
  });

  it("rejects an over-long title", () => {
    expect(() => post({ title: "가".repeat(121) })).toThrow("120자");
  });

  it("edit replaces title/body/pin", () => {
    const a = post({ pinned: false });
    a.edit({ title: "수정된 제목", body: "수정된 내용", pinned: true });
    expect(a.getTitle).toBe("수정된 제목");
    expect(a.getBody).toBe("수정된 내용");
    expect(a.isPinned).toBe(true);
  });
});
