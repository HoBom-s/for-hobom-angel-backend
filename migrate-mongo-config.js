// migrate-mongo configuration. The connection URI (with the Angel db name in its
// path) comes from the same env var the app uses. Run migrations as a deploy
// step: `npm run migrate:up`. In production autoIndex is off, so migrations are
// how indexes and data changes reach the database.
const config = {
  mongodb: {
    url: process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB,
    options: {},
  },
  migrationsDir: "migrations",
  changelogCollectionName: "migrations_changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "commonjs",
};

module.exports = config;
