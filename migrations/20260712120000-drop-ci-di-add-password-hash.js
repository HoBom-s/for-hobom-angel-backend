// Auth model change: 본인확인(CI/DI) based accounts -> email + password.
// Data-only (indexes are managed by the schema via `npm run indexes:sync`, which
// drops the now-removed `ci` unique index and builds the `email` unique index).
//
// For any pre-existing member: strip ci/di and stamp a locked password hash.
// "" is not a valid bcrypt hash, so bcrypt.compare always returns false — the
// account cannot log in until it sets a password (a reset flow is a follow-up).
// This is a greenfield DB, so in practice this touches nothing; it exists to
// keep the schema's `required: true` invariants satisfiable if data is present.
const LOCKED_PASSWORD = "";

module.exports = {
  async up(db) {
    await db.collection("users").updateMany(
      {},
      {
        $unset: { ci: "", di: "" },
        $setOnInsert: {},
      },
    );
    await db
      .collection("users")
      .updateMany(
        { passwordHash: { $exists: false } },
        { $set: { passwordHash: LOCKED_PASSWORD } },
      );
  },

  async down(db) {
    // ci/di are irrecoverable (the values came from an external provider), so the
    // down migration only removes the field this migration introduced.
    await db
      .collection("users")
      .updateMany({}, { $unset: { passwordHash: "" } });
  },
};
