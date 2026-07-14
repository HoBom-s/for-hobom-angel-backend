import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { CursorPageResponse } from "src/shared/pagination/cursor-page.response";
import { ResponseEntity } from "src/shared/response/response.entity";

/**
 * Swagger response decorators that reflect the real {@link ResponseEntity}
 * envelope every handler is wrapped in — the documented shape becomes
 * `{ success, items: <T>, message, timestamp }` instead of the bare payload.
 *
 *  - {@link ApiEnvelope}       200 with a single object payload
 *  - {@link ApiEnvelopeArray}  200 with an array payload
 *  - {@link ApiEnvelopeCursor} 200 with a cursor page payload
 *  - {@link ApiCreatedEnvelope} 201 with a single object payload (POST creates)
 */
function envelopeSchema(items: Record<string, unknown>) {
  return {
    allOf: [{ $ref: getSchemaPath(ResponseEntity) }, { properties: { items } }],
  };
}

export function ApiEnvelope<T extends Type<unknown>>(model: T) {
  return applyDecorators(
    ApiExtraModels(ResponseEntity, model),
    ApiOkResponse({
      schema: envelopeSchema({ $ref: getSchemaPath(model) }),
    }),
  );
}

export function ApiCreatedEnvelope<T extends Type<unknown>>(model: T) {
  return applyDecorators(
    ApiExtraModels(ResponseEntity, model),
    ApiCreatedResponse({
      schema: envelopeSchema({ $ref: getSchemaPath(model) }),
    }),
  );
}

export function ApiEnvelopeArray<T extends Type<unknown>>(model: T) {
  return applyDecorators(
    ApiExtraModels(ResponseEntity, model),
    ApiOkResponse({
      schema: envelopeSchema({
        type: "array",
        items: { $ref: getSchemaPath(model) },
      }),
    }),
  );
}

export function ApiEnvelopeCursor<T extends Type<unknown>>(model: T) {
  return applyDecorators(
    ApiExtraModels(ResponseEntity, CursorPageResponse, model),
    ApiOkResponse({
      schema: envelopeSchema({
        allOf: [
          { $ref: getSchemaPath(CursorPageResponse) },
          {
            properties: {
              items: { type: "array", items: { $ref: getSchemaPath(model) } },
            },
          },
        ],
      }),
    }),
  );
}
