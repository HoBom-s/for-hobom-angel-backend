import { ForbiddenException } from "@nestjs/common";
import { TenantScope } from "src/shared/tenant/tenant-scope";

describe("TenantScope", () => {
  describe("scoped (non-admin)", () => {
    const scope = TenantScope.of(false, ["s1", "s2"]);

    it("grants access only to its shelters", () => {
      expect(scope.canAccess("s1")).toBe(true);
      expect(scope.canAccess("s2")).toBe(true);
      expect(scope.canAccess("s3")).toBe(false);
    });

    it("assertAccess throws for a foreign shelter", () => {
      expect(() => scope.assertAccess("s1")).not.toThrow();
      expect(() => scope.assertAccess("s3")).toThrow(ForbiddenException);
    });

    it("mongoFilter constrains to accessible shelters", () => {
      expect(scope.mongoFilter()).toEqual({ shelterId: { $in: ["s1", "s2"] } });
      expect(scope.mongoFilter("shelter")).toEqual({
        shelter: { $in: ["s1", "s2"] },
      });
    });
  });

  describe("platform admin", () => {
    const scope = TenantScope.platform();

    it("can access any shelter", () => {
      expect(scope.canAccess("anything")).toBe(true);
      expect(() => scope.assertAccess("anything")).not.toThrow();
      expect(scope.isPlatformAdmin).toBe(true);
    });

    it("has an empty (unconstrained) mongo filter", () => {
      expect(scope.mongoFilter()).toEqual({});
    });
  });

  it("a non-admin with no shelters matches nothing", () => {
    const scope = TenantScope.of(false, []);
    expect(scope.canAccess("s1")).toBe(false);
    expect(scope.mongoFilter()).toEqual({ shelterId: { $in: [] } });
  });
});
