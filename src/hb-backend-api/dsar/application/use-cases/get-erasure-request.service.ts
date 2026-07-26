import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ErasureEngine } from "src/shared/erasure/erasure-engine";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ErasureRequestView } from "src/hb-backend-api/dsar/domain/model/erasure-request-view";
import { toErasureRequestView } from "src/hb-backend-api/dsar/application/erasure-request.mapper";
import {
  GetErasureRequestCommand,
  GetErasureRequestUseCase,
} from "src/hb-backend-api/dsar/domain/ports/in/get-erasure-request.use-case";

/** Reads an erasure request's progress / final report (operator only). */
@Injectable()
export class GetErasureRequestService implements GetErasureRequestUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    private readonly engine: ErasureEngine,
  ) {}

  public async invoke(
    command: GetErasureRequestCommand,
  ): Promise<ErasureRequestView> {
    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 조회할 수 있어요.");
    }
    if (!Types.ObjectId.isValid(command.requestId)) {
      throw new NotFoundException("파기 요청을 찾을 수 없어요.");
    }
    const request = await this.engine.getRequest(command.requestId);
    if (!request) {
      throw new NotFoundException("파기 요청을 찾을 수 없어요.");
    }
    return toErasureRequestView(request);
  }
}
