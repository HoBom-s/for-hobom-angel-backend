import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiCreatedEnvelope,
  ApiEnvelope,
  ApiEnvelopeArray,
  ApiEnvelopeCursor,
} from "src/shared/response/api-envelope.decorator";
import { RegisterAnimalResponse } from "src/hb-backend-api/animal/adapters/in/dto/register-animal.response";
import { EndPointPrefixConstant } from "src/shared/constants/endpoint-prefix.constant";
import { DIToken } from "src/shared/di/token.di";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { CurrentUser } from "src/hb-backend-api/auth/adapters/in/rest/decorator/current-user.decorator";
import { JwtAuthGuard } from "src/hb-backend-api/auth/adapters/in/rest/guard/jwt-auth.guard";
import { AuthenticatedUser } from "src/hb-backend-api/auth/domain/model/token-pair";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import {
  RegisterAnimalResult,
  RegisterAnimalUseCase,
} from "src/hb-backend-api/animal/domain/ports/in/register-animal.use-case";
import { UpdateAnimalProfileUseCase } from "src/hb-backend-api/animal/domain/ports/in/update-animal-profile.use-case";
import { RelistAnimalUseCase } from "src/hb-backend-api/animal/domain/ports/in/relist-animal.use-case";
import { SetAnimalBlindUseCase } from "src/hb-backend-api/animal/domain/ports/in/set-animal-blind.use-case";
import { AnimalSort } from "src/hb-backend-api/animal/domain/enums/animal-sort.enum";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { RegisterAnimalDto } from "src/hb-backend-api/animal/adapters/in/dto/register-animal.dto";
import { UpdateAnimalProfileDto } from "src/hb-backend-api/animal/adapters/in/dto/update-animal-profile.dto";
import { SearchAnimalsQueryDto } from "src/hb-backend-api/animal/adapters/in/dto/search-animals.query.dto";
import { AnimalResponse } from "src/hb-backend-api/animal/adapters/in/dto/animal.response";

@ApiTags("Animals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(EndPointPrefixConstant)
export class AnimalController {
  constructor(
    @Inject(DIToken.AnimalModule.RegisterAnimalUseCase)
    private readonly registerAnimalUseCase: RegisterAnimalUseCase,
    @Inject(DIToken.AnimalModule.UpdateAnimalProfileUseCase)
    private readonly updateAnimalProfileUseCase: UpdateAnimalProfileUseCase,
    @Inject(DIToken.AnimalModule.RelistAnimalUseCase)
    private readonly relistAnimalUseCase: RelistAnimalUseCase,
    @Inject(DIToken.AnimalModule.SetAnimalBlindUseCase)
    private readonly setAnimalBlindUseCase: SetAnimalBlindUseCase,
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
  ) {}

  @ApiOperation({ summary: "동물 등록 (검증된 보호소의 스태프)" })
  @ApiCreatedEnvelope(RegisterAnimalResponse)
  @Post("shelters/:shelterId/animals")
  public register(
    @CurrentUser() user: AuthenticatedUser,
    @Param("shelterId") shelterId: string,
    @Body() body: RegisterAnimalDto,
  ): Promise<RegisterAnimalResult> {
    return this.registerAnimalUseCase.invoke({
      shelterId,
      registeredBy: user.userId,
      ...body,
    });
  }

  @ApiOperation({ summary: "동물 프로필 수정 (스태프)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch("animals/:animalId")
  public async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("animalId") animalId: string,
    @Body() body: UpdateAnimalProfileDto,
  ): Promise<void> {
    await this.updateAnimalProfileUseCase.invoke({
      animalId,
      editedBy: user.userId,
      ...body,
    });
  }

  @ApiOperation({ summary: "동물 탐색/검색 (필터 + 커서 페이지네이션)" })
  @ApiEnvelopeCursor(AnimalResponse)
  @Get("animals")
  public async search(
    @Query() query: SearchAnimalsQueryDto,
  ): Promise<CursorPageResponse<AnimalResponse>> {
    const page = await this.animalQueryPort.search({
      species: query.species,
      size: query.size,
      sex: query.sex,
      status: query.status,
      keyword: query.keyword,
      cursor: query.cursor,
      limit: query.limit ?? 20,
      sort: query.sort ?? AnimalSort.LATEST,
    });
    return CursorPageResponse.of(page, (animal) => AnimalResponse.from(animal));
  }

  @ApiOperation({ summary: "동물 단건 조회" })
  @ApiEnvelope(AnimalResponse)
  @Get("animals/:animalId")
  public async getOne(
    @Param("animalId") animalId: string,
  ): Promise<AnimalResponse> {
    const animal = await this.animalQueryPort.findById(
      AnimalId.fromString(animalId),
    );
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }
    return AnimalResponse.from(animal);
  }

  @ApiOperation({ summary: "보호소 동물 목록" })
  @ApiEnvelopeArray(AnimalResponse)
  @Get("shelters/:shelterId/animals")
  public async listByShelter(
    @Param("shelterId") shelterId: string,
  ): Promise<AnimalResponse[]> {
    const animals = await this.animalQueryPort.findByShelter(
      ShelterId.fromString(shelterId),
    );
    return animals.map((animal) => AnimalResponse.from(animal));
  }

  @ApiOperation({ summary: "반환된 동물 재등록 (스태프) — 다시 입양 가능으로" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("animals/:animalId/relist")
  public async relist(
    @CurrentUser() user: AuthenticatedUser,
    @Param("animalId") animalId: string,
  ): Promise<void> {
    await this.relistAnimalUseCase.invoke({
      animalId,
      actorId: user.userId,
    });
  }

  @ApiOperation({ summary: "동물 블라인드 (운영자) — 탐색에서 숨김" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("animals/:animalId/blind")
  public async blind(
    @CurrentUser() user: AuthenticatedUser,
    @Param("animalId") animalId: string,
  ): Promise<void> {
    await this.setAnimalBlindUseCase.invoke({
      animalId,
      actorId: user.userId,
      blinded: true,
    });
  }

  @ApiOperation({ summary: "동물 블라인드 해제 (운영자)" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("animals/:animalId/unblind")
  public async unblind(
    @CurrentUser() user: AuthenticatedUser,
    @Param("animalId") animalId: string,
  ): Promise<void> {
    await this.setAnimalBlindUseCase.invoke({
      animalId,
      actorId: user.userId,
      blinded: false,
    });
  }
}
