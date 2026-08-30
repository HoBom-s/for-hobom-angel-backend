import {
  PostBlock,
  PostBlockInput,
  PostBlockType,
} from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";
import { InvalidInputError } from "src/shared/exception/domain-exception";

const MAX_BLOCKS = 50;
const MAX_IMAGES = 20;
const MAX_TEXT_TOTAL = 5000;
const MAX_CAPTION = 200;

/**
 * A post's body as an ordered block list, so images sit between paragraphs
 * ("본문 중간중간에"). Immutable. Enforces the shape: at least one block, each
 * TEXT non-empty, each IMAGE keyed, and sane totals.
 */
export class PostContent {
  private constructor(private readonly blocks: PostBlock[]) {
    Object.freeze(this);
    Object.freeze(this.blocks);
  }

  public static of(blocks: PostBlockInput[]): PostContent {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new InvalidInputError("후기 내용이 필요해요.");
    }
    if (blocks.length > MAX_BLOCKS) {
      throw new InvalidInputError(`블록은 최대 ${MAX_BLOCKS}개까지예요.`);
    }

    let textTotal = 0;
    let imageCount = 0;
    const normalized: PostBlock[] = blocks.map((block) => {
      if (block.type === PostBlockType.TEXT) {
        const text = block.text?.trim();
        if (!text) {
          throw new InvalidInputError("빈 텍스트 블록은 넣을 수 없어요.");
        }
        textTotal += text.length;
        return { type: PostBlockType.TEXT, text };
      }
      if (block.type === PostBlockType.IMAGE) {
        const imageKey = block.imageKey?.trim();
        if (!imageKey) {
          throw new InvalidInputError("이미지 블록에는 이미지가 필요해요.");
        }
        imageCount += 1;
        return {
          type: PostBlockType.IMAGE,
          imageKey,
          caption: block.caption?.trim() || null,
        };
      }
      throw new InvalidInputError("알 수 없는 블록 유형이에요.");
    });

    if (textTotal > MAX_TEXT_TOTAL) {
      throw new InvalidInputError(
        `본문은 ${MAX_TEXT_TOTAL}자까지 쓸 수 있어요.`,
      );
    }
    if (imageCount > MAX_IMAGES) {
      throw new InvalidInputError(`이미지는 최대 ${MAX_IMAGES}장까지예요.`);
    }
    if (
      normalized.some(
        (b) =>
          b.type === PostBlockType.IMAGE &&
          b.caption !== null &&
          b.caption.length > MAX_CAPTION,
      )
    ) {
      throw new InvalidInputError(`캡션은 ${MAX_CAPTION}자까지예요.`);
    }

    return new PostContent(normalized);
  }

  public get getBlocks(): PostBlock[] {
    return [...this.blocks];
  }

  /** The object keys of every image block — the attached-image manifest. */
  public get getImageKeys(): string[] {
    return this.blocks
      .filter(
        (b): b is Extract<PostBlock, { type: PostBlockType.IMAGE }> =>
          b.type === PostBlockType.IMAGE,
      )
      .map((b) => b.imageKey);
  }
}
