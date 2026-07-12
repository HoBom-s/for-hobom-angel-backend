@Library('hobom-shared-lib') _

// Angel BE deploy job.
// hostPort 8084 (external) -> 8080 (container). 8083 is taken by
// dev-hobom-space-backend. Reuses shared docker repo/creds; tag is
// distinguished by serviceName. gRPC TLS certs mounted read-only.
hobomPipeline(
  serviceName:    'dev-for-hobom-angel-backend',
  hostPort:       '8084',
  containerPort:  '8080',
  memory:         '512m',
  cpus:           '1',
  envPath:        '/etc/hobom-dev/dev-for-hobom-angel-backend/.env',
  addHost:        true,
  extraVolumes:   ['/home/infra-admin/certs:/etc/grpc-tls:ro'],
  smokeCheckPath: '/',
  liveHostPort:   '18084',
  liveEnvPath:    '/etc/hobom-live/live-for-hobom-angel-backend/.env'
)
