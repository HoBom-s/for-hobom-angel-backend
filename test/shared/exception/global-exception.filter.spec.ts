import { ArgumentsHost, BadRequestException } from "@nestjs/common";
import { DiscordWebhookService } from "src/shared/discord/discord-webhook.service";
import { GlobalExceptionFilter } from "src/shared/exception/global-exception.filter";
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
  InvalidInputError,
} from "src/shared/exception/domain-exception";

const makeHost = (url = "/x", method = "GET") => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url, method }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

describe("GlobalExceptionFilter", () => {
  const discord = {
    notifyError: jest.fn(),
  } as unknown as DiscordWebhookService;
  const filter = new GlobalExceptionFilter(discord);

  beforeEach(() => jest.clearAllMocks());

  it("maps an HttpException to its status and message", () => {
    const { host, status, json } = makeHost();
    filter.catch(new BadRequestException("bad input"), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "bad input",
        path: "/x",
      }),
    );
    expect(discord.notifyError).not.toHaveBeenCalled();
  });

  it("masks an unknown error as a generic 500 and alerts Discord", () => {
    const { host, status, json } = makeHost();
    filter.catch(new Error("db password leaked in message"), host);
    expect(status).toHaveBeenCalledWith(500);
    // The raw message must never reach the client.
    const body = json.mock.calls[0][0] as { message: string };
    expect(body.message).not.toContain("db password");
    expect(body.message).toBe(
      "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
    );
    expect(discord.notifyError).toHaveBeenCalled();
  });

  it.each([
    [new EntityNotFoundError("없어요"), 404],
    [new BusinessRuleViolationError("상태 위반"), 409],
    [new InvalidInputError("형식 오류"), 400],
  ])("maps a domain error to its status (%s)", (error, expected) => {
    const { host, status, json } = makeHost();
    filter.catch(error, host);
    expect(status).toHaveBeenCalledWith(expected);
    // Domain messages are safe to surface to the client.
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: expected, message: error.message }),
    );
    // 4xx must not trigger the 5xx Discord alert.
    expect(discord.notifyError).not.toHaveBeenCalled();
  });

  it("joins array validation messages", () => {
    const { host, json } = makeHost();
    filter.catch(
      new BadRequestException({
        message: ["a", "b"],
        error: "Bad Request",
        statusCode: 400,
      }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "a, b" }),
    );
  });
});
