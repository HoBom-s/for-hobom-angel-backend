import { RetentionPolicy } from "src/shared/erasure/retention-policy";
import { AuditRetentionSchedule } from "src/hb-backend-api/audit/adapters/in/schedule/audit-retention.schedule";

describe("AuditRetentionSchedule", () => {
  const build = (purged: number) => {
    const repo = {
      save: jest.fn(),
      purgeOlderThan: jest.fn().mockResolvedValue(purged),
    };
    const lock = {
      runExclusive: (_k: string, _t: number, fn: () => Promise<unknown>) =>
        fn(),
    };
    return {
      schedule: new AuditRetentionSchedule(repo, lock as never),
      repo,
    };
  };

  it("purges audit logs older than the retention window", async () => {
    const { schedule, repo } = build(7);
    await schedule.handle();

    expect(repo.purgeOlderThan).toHaveBeenCalledTimes(1);
    const cutoff = repo.purgeOlderThan.mock.calls[0][0] as Date;
    expect(cutoff.getFullYear()).toBe(
      new Date().getFullYear() - RetentionPolicy.auditLogYears,
    );
  });

  it("does not throw when there is nothing to purge", async () => {
    const { schedule } = build(0);
    await expect(schedule.handle()).resolves.toBeUndefined();
  });
});
