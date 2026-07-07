// Initial indexes for the Angel collections. Mirrors the indexes declared on the
// Mongoose schemas (users, outbox, audit_logs); in production autoIndex is off,
// so this migration is what actually builds them. Keep in sync when a schema
// index changes (a schema index without a matching migration will not exist in
// production).
module.exports = {
  async up(db) {
    await db.collection("users").createIndexes([
      { key: { nickname: 1 }, name: "nickname_unique", unique: true },
      { key: { ci: 1 }, name: "ci_unique", unique: true },
      { key: { status: 1, purgeAfter: 1 }, name: "status_purgeAfter" },
    ]);

    await db.collection("outbox").createIndexes([
      { key: { eventType: 1, status: 1 }, name: "eventType_status" },
      { key: { status: 1, createdAt: 1 }, name: "status_createdAt" },
    ]);

    await db.collection("audit_logs").createIndexes([
      { key: { subjectUserId: 1, createdAt: -1 }, name: "subject_createdAt" },
      { key: { actorId: 1, createdAt: -1 }, name: "actor_createdAt" },
    ]);
  },

  async down(db) {
    const drop = async (collection, names) => {
      for (const name of names) {
        await db
          .collection(collection)
          .dropIndex(name)
          .catch(() => undefined);
      }
    };
    await drop("users", ["nickname_unique", "ci_unique", "status_purgeAfter"]);
    await drop("outbox", ["eventType_status", "status_createdAt"]);
    await drop("audit_logs", ["subject_createdAt", "actor_createdAt"]);
  },
};
