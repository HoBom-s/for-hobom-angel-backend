import { ServerCredentials } from "@grpc/grpc-js";
import { existsSync, readFileSync } from "fs";

/**
 * Builds gRPC server credentials. Returns `undefined` (insecure/plaintext) when
 * TLS cert/key are not configured or the files are missing — dev runs plaintext,
 * prod mounts certs at /etc/grpc-tls (Jenkins extraVolumes).
 */
export function buildGrpcCredentials(): ServerCredentials | undefined {
  const certPath = process.env.HOBOM_GRPC_TLS_CERT;
  const keyPath = process.env.HOBOM_GRPC_TLS_KEY;
  if (!certPath || !keyPath || !existsSync(certPath) || !existsSync(keyPath)) {
    return undefined;
  }
  return ServerCredentials.createSsl(null, [
    {
      cert_chain: readFileSync(certPath),
      private_key: readFileSync(keyPath),
    },
  ]);
}
