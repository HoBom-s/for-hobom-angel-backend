// #106 added `eligiblePlacements` to animals (the application types an animal
// accepts). The Mongoose schema default only applies to NEWLY written docs, and
// the read-mapper's backfill only affects what a single GET returns — neither
// touches the stored documents, so the `?placement=ADOPTION|FOSTER` catalog
// filter (a DB-level `{ eligiblePlacements: <type> }` match) skips every animal
// that predates the field.
//
// Backfill pre-existing animals to accept both, matching the prior "any
// AVAILABLE animal takes either application" behavior.
const BOTH = ["ADOPTION", "FOSTER"];

module.exports = {
  async up(db) {
    await db
      .collection("animals")
      .updateMany(
        { eligiblePlacements: { $exists: false } },
        { $set: { eligiblePlacements: BOTH } },
      );
  },

  async down(db) {
    // Coarse reverse: remove the field this migration introduced. (Docs written
    // after the feature shipped re-acquire it from the schema default on save.)
    await db
      .collection("animals")
      .updateMany({}, { $unset: { eligiblePlacements: "" } });
  },
};
