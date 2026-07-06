import { ArgumentsHost, BadRequestException } from "@nestjs/common";
import { DiscordWebhookService } from "src/shared/discord/discord-webhook.service";
import { GlobalExceptionFilter } from "src/shared/exception/global-exception.filter";

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

  it("maps an unknown error to 500 and alerts Discord", () => {
    const { host, status } = makeHost();
    filter.catch(new Error("boom"), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(discord.notifyError).toHaveBeenCalled();
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
