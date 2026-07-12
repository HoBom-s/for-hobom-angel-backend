import { ApiProperty } from "@nestjs/swagger";
import { Page } from "src/shared/pagination/page";

/** HTTP envelope for a cursor-paginated list. */
export class CursorPageResponse<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;

  @ApiProperty()
  hasNext: boolean;

  constructor(items: T[], nextCursor: string | null, hasNext: boolean) {
    this.items = items;
    this.nextCursor = nextCursor;
    this.hasNext = hasNext;
  }

  /** Maps a domain {@link Page} into a response, projecting each item. */
  public static of<D, R>(
    page: Page<D>,
    project: (item: D) => R,
  ): CursorPageResponse<R> {
    return new CursorPageResponse(
      page.items.map(project),
      page.nextCursor,
      page.hasNext,
    );
  }
}
