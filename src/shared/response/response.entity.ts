import { ApiProperty } from "@nestjs/swagger";

/**
 * Uniform success envelope. All controller return values are wrapped by
 * {@link ResponseWrapInterceptor} unless the handler already returns one.
 * The payload lives in `items`; the `ApiEnvelope*` decorators document the real
 * wrapped shape in Swagger.
 */
export class ResponseEntity<T> {
  @ApiProperty({ example: true })
  public readonly success: boolean;

  @ApiProperty({ description: "응답 페이로드" })
  public readonly items: T;

  @ApiProperty({ example: "OK" })
  public readonly message: string;

  @ApiProperty({ example: "2026-07-14T00:00:00.000Z" })
  public readonly timestamp: string;

  private constructor(
    success: boolean,
    items: T,
    message: string,
    timestamp: string,
  ) {
    this.success = success;
    this.items = items;
    this.message = message;
    this.timestamp = timestamp;
  }

  public static ok<T>(items: T, message = "OK"): ResponseEntity<T> {
    return new ResponseEntity<T>(
      true,
      items,
      message,
      new Date().toISOString(),
    );
  }
}
