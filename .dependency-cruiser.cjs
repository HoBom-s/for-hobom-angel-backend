/**
 * Architecture boundary rules for the modular monolith. These lock invariants
 * that are currently TRUE (verified when introduced) so they can't silently
 * erode as the codebase grows — the cheap alternative to physically splitting
 * into packages.
 *
 * Run: `npm run depcruise`
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "No import cycles. The domain dependency graph is a DAG; keep it that way.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-cross-domain-infra",
      severity: "error",
      comment:
        "A domain must not reach into ANOTHER domain's infra (repositories/DB). " +
        "Cross-domain access goes through ports (domain/ports) + DI, never persistence internals.",
      from: { path: "^src/hb-backend-api/([^/]+)/" },
      to: {
        path: "^src/hb-backend-api/([^/]+)/infra/",
        pathNot: "^src/hb-backend-api/$1/",
      },
    },
    {
      name: "shared-no-feature-impl",
      severity: "error",
      comment:
        "The shared platform layer must not depend on any feature's implementation " +
        "(infra/adapters). Coordinating via a feature's domain contract is tolerated; " +
        "reaching into its implementation is not.",
      from: { path: "^src/shared/" },
      to: { path: "^src/hb-backend-api/[^/]+/(infra|adapters)/" },
    },
    {
      name: "no-orphan-import-of-test",
      severity: "error",
      comment: "Production code must not import test files.",
      from: { pathNot: "\\.spec\\.ts$" },
      to: { path: "\\.spec\\.ts$" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".js", ".json"],
    },
    exclude: {
      path: "\\.spec\\.ts$|^test/|node_modules",
    },
  },
};
