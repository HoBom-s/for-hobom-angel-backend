import { ConfigService } from "@nestjs/config";
import { DiscordWebhookService } from "src/shared/discord/discord-webhook.service";

const make = (url?: string): DiscordWebhookService =>
  new DiscordWebhookService({
    get: () => url,
  } as unknown as ConfigService);

describe("DiscordWebhookService", () => {
  afterEach(() => jest.restoreAllMocks());

  it("no-ops when the webhook url is unset", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    await make(undefined).notifyError("x");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to the webhook when configured", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({} as Response);
    await make("https://hook").notifyError("boom");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hook",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("swallows delivery failures", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("net"));
    await expect(
      make("https://hook").notifyError("x"),
    ).resolves.toBeUndefined();
  });
});
