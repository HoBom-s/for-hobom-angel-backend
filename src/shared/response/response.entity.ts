/**
 * Uniform success envelope. All controller return values are wrapped by
 * {@link ResponseWrapInterceptor} unless the handler already returns one.
 */
export class ResponseEntity<T> {
  private constructor(
    public readonly success: boolean,
    public readonly items: T,
    public readonly message: string,
    public readonly timestamp: string,
  ) {}

  public static ok<T>(items: T, message = "OK"): ResponseEntity<T> {
    return new ResponseEntity<T>(
      true,
      items,
      message,
      new Date().toISOString(),
    );
  }
}
