import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseEntity } from "src/shared/response/response.entity";

/**
 * Wraps every handler result in {@link ResponseEntity}. If a handler already
 * returns a ResponseEntity (or a raw stream/undefined), it is passed through.
 */
@Injectable()
export class ResponseWrapInterceptor implements NestInterceptor {
  public intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(
        map((data: unknown) =>
          data instanceof ResponseEntity ? data : ResponseEntity.ok(data),
        ),
      );
  }
}
