import { ErasureRequestView } from "src/hb-backend-api/dsar/domain/model/erasure-request-view";
import { ErasureRequestEntity } from "src/shared/erasure/erasure-request.entity";

export function toErasureRequestView(
  entity: ErasureRequestEntity,
): ErasureRequestView {
  const tasks = entity.tasks.map((t) => ({
    key: t.key,
    category: t.category,
    disposition: t.disposition,
    status: t.status,
    affected: t.affected,
    retained: t.retained,
    attempts: t.attempts,
  }));
  return {
    requestId: String(entity._id),
    subjectId: String(entity.subjectId),
    status: entity.status,
    tasks,
    totalAffected: tasks.reduce((sum, t) => sum + t.affected, 0),
    totalRetained: tasks.reduce((sum, t) => sum + t.retained, 0),
    requestedAt: entity.createdAt ?? null,
    completedAt: entity.completedAt ?? null,
  };
}
