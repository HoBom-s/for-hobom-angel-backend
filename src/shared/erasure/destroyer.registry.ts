import { Injectable } from "@nestjs/common";
import { Destroyer } from "src/shared/erasure/destroyer.abstract";

/**
 * Collects every {@link Destroyer} across the app. Domain modules self-register
 * their destroyer on init (mirrors ApprovalCallbackRegistry), keeping the engine
 * ignorant of any specific domain. {@link ordered} yields them by `priority`.
 */
@Injectable()
export class DestroyerRegistry {
  private readonly destroyers: Destroyer[] = [];

  public register(destroyer: Destroyer): void {
    if (this.destroyers.some((d) => d.key === destroyer.key)) {
      throw new Error(`중복된 Destroyer key예요: ${destroyer.key}`);
    }
    this.destroyers.push(destroyer);
  }

  public ordered(): Destroyer[] {
    return [...this.destroyers].sort((a, b) => a.priority - b.priority);
  }

  public byKey(key: string): Destroyer {
    const destroyer = this.destroyers.find((d) => d.key === key);
    if (!destroyer) {
      throw new Error(`등록된 Destroyer가 없어요: ${key}`);
    }
    return destroyer;
  }
}
