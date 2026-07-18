/** A read view of an erasure request + its per-category outcomes (the report). */
export interface ErasureTaskView {
  key: string;
  category: string;
  disposition: string;
  status: string;
  affected: number;
  retained: number;
  attempts: number;
}

export interface ErasureRequestView {
  requestId: string;
  subjectId: string;
  status: string;
  tasks: ErasureTaskView[];
  totalAffected: number;
  totalRetained: number;
  requestedAt: Date | null;
  completedAt: Date | null;
}
