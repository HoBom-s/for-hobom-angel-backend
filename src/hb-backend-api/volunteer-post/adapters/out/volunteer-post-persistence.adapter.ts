import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { VolunteerPostPersistencePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-persistence.port";
import { VolunteerPostRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post.repository";
import { toInsertDoc } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post.mapper";

@Injectable()
export class VolunteerPostPersistenceAdapter implements VolunteerPostPersistencePort {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostRepository)
    private readonly repository: VolunteerPostRepository,
  ) {}

  public async create(post: VolunteerPost): Promise<VolunteerPost> {
    await this.repository.insert(toInsertDoc(post));
    return post;
  }

  public async remove(post: VolunteerPost): Promise<void> {
    await this.repository.deleteById(post.getId.raw);
  }
}
