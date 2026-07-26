/** A post's body is an ordered list of these blocks, so images sit inline. */
export enum PostBlockType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
}

export interface TextBlock {
  type: PostBlockType.TEXT;
  text: string;
}

export interface ImageBlock {
  type: PostBlockType.IMAGE;
  /** Object key uploaded via the media presign flow. */
  imageKey: string;
  caption: string | null;
}

export type PostBlock = TextBlock | ImageBlock;

/** Raw block input (from a command/DTO) before validation/normalization. */
export interface PostBlockInput {
  type: PostBlockType;
  text?: string;
  imageKey?: string;
  caption?: string;
}
