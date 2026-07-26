import { PostBlockType } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";
import { PostContent } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-content";

describe("PostContent", () => {
  it("normalizes blocks: trims text, trims image key, blank caption → null", () => {
    const content = PostContent.of([
      { type: PostBlockType.TEXT, text: "  안녕  " },
      { type: PostBlockType.IMAGE, imageKey: "  a.webp  ", caption: "  " },
    ]);
    expect(content.getBlocks).toEqual([
      { type: PostBlockType.TEXT, text: "안녕" },
      { type: PostBlockType.IMAGE, imageKey: "a.webp", caption: null },
    ]);
    expect(content.getImageKeys).toEqual(["a.webp"]);
  });

  it("requires at least one block", () => {
    expect(() => PostContent.of([])).toThrow("내용");
  });

  it("rejects an empty text block and a keyless image block", () => {
    expect(() =>
      PostContent.of([{ type: PostBlockType.TEXT, text: "   " }]),
    ).toThrow("텍스트");
    expect(() =>
      PostContent.of([{ type: PostBlockType.IMAGE, imageKey: "" }]),
    ).toThrow("이미지");
  });

  it("caps total text length and image count", () => {
    expect(() =>
      PostContent.of([{ type: PostBlockType.TEXT, text: "a".repeat(5001) }]),
    ).toThrow("본문");
    const manyImages = Array.from({ length: 21 }, (_, i) => ({
      type: PostBlockType.IMAGE,
      imageKey: `${i}.webp`,
    }));
    expect(() => PostContent.of(manyImages)).toThrow("이미지");
  });

  it("is immutable", () => {
    const content = PostContent.of([{ type: PostBlockType.TEXT, text: "x" }]);
    expect(Object.isFrozen(content)).toBe(true);
  });
});
