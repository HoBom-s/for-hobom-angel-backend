import { join } from "path";
import { existsSync } from "fs";
import { Transport } from "@nestjs/microservices";
import type { GrpcOptions } from "@nestjs/microservices";
import { buildGrpcCredentials } from "src/infra/grpc/grpc-credentials";

// The Angel outbox contract lives in two files under one `outbox.angel` package.
const PROTO_DIR = ["angel", "outbox", "v1"];
const PROTO_FILES = [
  "find-hobom-angel-outbox.proto",
  "patch-hobom-angel-outbox.proto",
];

/**
 * gRPC server options for the outbox service consumed by hobom-event-processor
 * (AngelPoller). The proto is pulled from hobom-buf-proto via
 * `npm run proto:pull` once the Angel outbox contract is published there.
 *
 * Returns `null` when the proto is absent so the app can still boot (HTTP-only)
 * during the interim before the proto lands. Wire it up in main.ts:
 *
 *   const grpc = buildGrpcOptions();
 *   if (grpc) { app.connectMicroservice(grpc); await app.startAllMicroservices(); }
 */
export function buildGrpcOptions(): GrpcOptions | null {
  // Relative to compiled dist/, proto/ sits at the repo root and is copied
  // into the image (see Dockerfile).
  const protoRoot = join(__dirname, "..", "..", "..", "proto");
  const protoPaths = PROTO_FILES.map((file) =>
    join(protoRoot, ...PROTO_DIR, file),
  );

  if (!protoPaths.every((path) => existsSync(path))) {
    return null;
  }

  return {
    transport: Transport.GRPC,
    options: {
      url: `${process.env.HOBOM_GRPC_HOST ?? "0.0.0.0"}:${process.env.HOBOM_GRPC_PORT ?? "50051"}`,
      package: "outbox.angel",
      protoPath: protoPaths,
      credentials: buildGrpcCredentials(),
      // keepCase: emit proto field names verbatim (mixed camel/snake); enums as
      // their value names — the mapper produces exactly this shape.
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  };
}
