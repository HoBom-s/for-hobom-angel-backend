import { ApiProperty } from "@nestjs/swagger";
import { ErasureRequestView } from "src/hb-backend-api/dsar/domain/model/erasure-request-view";

class ErasureTaskResponse {
  @ApiProperty()
  public key: string;

  @ApiProperty()
  public category: string;

  @ApiProperty()
  public disposition: string;

  @ApiProperty()
  public status: string;

  @ApiProperty()
  public affected: number;

  @ApiProperty()
  public retained: number;

  @ApiProperty()
  public attempts: number;
}

/** The erasure report / request progress — the DSAR erasure evidence. */
export class ErasureRequestResponse {
  @ApiProperty()
  public requestId: string;

  @ApiProperty()
  public subjectId: string;

  @ApiProperty()
  public status: string;

  @ApiProperty({ type: [ErasureTaskResponse] })
  public tasks: ErasureTaskResponse[];

  @ApiProperty()
  public totalAffected: number;

  @ApiProperty()
  public totalRetained: number;

  @ApiProperty({ type: Date, nullable: true })
  public requestedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  public completedAt: Date | null;

  public static from(view: ErasureRequestView): ErasureRequestResponse {
    const response = new ErasureRequestResponse();
    response.requestId = view.requestId;
    response.subjectId = view.subjectId;
    response.status = view.status;
    response.tasks = view.tasks;
    response.totalAffected = view.totalAffected;
    response.totalRetained = view.totalRetained;
    response.requestedAt = view.requestedAt;
    response.completedAt = view.completedAt;
    return response;
  }
}
