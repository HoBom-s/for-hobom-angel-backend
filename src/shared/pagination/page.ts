/**
 * A cursor-paginated slice of read results. `nextCursor` is the opaque cursor to
 * pass back for the following page (null when there are no more). Cursors are
 * ordered newest-first by document id.
 */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}
