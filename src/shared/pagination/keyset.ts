import { Types } from "mongoose";
import { Page } from "src/shared/pagination/page";

/**
 * Shared helpers for newest-first (`_id` descending) keyset pagination — the one
 * cursor scheme used across every list endpoint. Repos build the query with
 * {@link keysetFilter}; read adapters parse the incoming cursor with
 * {@link parseCursor} and assemble the page with {@link toCursorPage}.
 */

/** Parse an opaque cursor into an ObjectId, or null when absent/invalid. */
export function parseCursor(
  cursor: string | null | undefined,
): Types.ObjectId | null {
  return cursor && Types.ObjectId.isValid(cursor)
    ? new Types.ObjectId(cursor)
    : null;
}

/**
 * The `_id < cursor` fragment for newest-first paging, to spread into a Mongoose
 * filter: `find({ ...filter, ...keysetFilter(cursorId) })`. Empty on the first
 * page.
 */
export function keysetFilter(
  cursorId: Types.ObjectId | null,
): Record<string, never> | { _id: { $lt: Types.ObjectId } } {
  return cursorId ? { _id: { $lt: cursorId } } : {};
}

/**
 * Assemble a {@link Page} from a keyset query fetched with `limit + 1` docs,
 * sorted newest-first. The extra doc signals `hasNext`; the last kept doc's
 * `_id` becomes the next cursor.
 */
export function toCursorPage<E extends { _id: unknown }, D>(
  docs: E[],
  limit: number,
  toDomain: (doc: E) => D,
): Page<D> {
  const hasNext = docs.length > limit;
  const pageDocs = hasNext ? docs.slice(0, limit) : docs;
  const last = pageDocs[pageDocs.length - 1];
  return {
    items: pageDocs.map(toDomain),
    hasNext,
    nextCursor: hasNext && last ? String(last._id) : null,
  };
}
