import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";
import { ErasureEngine } from "src/shared/erasure/erasure-engine";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ErasureRequestView } from "src/hb-backend-api/dsar/domain/model/erasure-request-view";
import { toErasureRequestView } from "src/hb-backend-api/dsar/application/erasure-request.mapper";
import {
  ListSubjectErasuresCommand,
  ListSubjectErasuresUseCase,
} from "src/hb-backend-api/dsar/domain/ports/in/list-subject-erasures.use-case";

@Injectable()
export class ListSubjectErasuresService implements ListSubjectErasuresUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    private readonly engine: ErasureEngine,
  ) {}

  public async invoke(
    command: ListSubjectErasuresCommand,
  ): Promise<ErasureRequestView[]> {
    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 조회할 수 있어요.");
    }
    if (!Types.ObjectId.isValid(command.subjectId)) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }
    const requests = await this.engine.getRequestsBySubject(command.subjectId);
    return requests.map(toErasureRequestView);
  }
}
