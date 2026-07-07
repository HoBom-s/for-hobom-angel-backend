import { Injectable } from "@nestjs/common";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalCallback } from "src/hb-backend-api/approval/domain/ports/out/approval-callback";

/**
 * Maps each {@link ApprovalType} to its completion callback. Consumer modules
 * self-register their callback on init, keeping the engine ignorant of any
 * specific domain.
 */
@Injectable()
export class ApprovalCallbackRegistry {
  private readonly callbacks = new Map<ApprovalType, ApprovalCallback>();

  public register(callback: ApprovalCallback): void {
    this.callbacks.set(callback.type, callback);
  }

  public get(type: ApprovalType): ApprovalCallback {
    const callback = this.callbacks.get(type);
    if (!callback) {
      throw new Error(`등록된 승인 콜백이 없어요: ${type}`);
    }
    return callback;
  }
}
