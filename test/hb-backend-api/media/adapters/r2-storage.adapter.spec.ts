import { ConfigService } from "@nestjs/config";
import { R2StorageAdapter } from "src/hb-backend-api/media/adapters/out/r2-storage.adapter";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://r2/presigned-put"),
}));

const configWith = (values: Record<string, string>): ConfigService =>
  ({
    getOrThrow: (key: string) => {
      if (!(key in values)) {
        throw new Error(`missing ${key}`);
      }
      return values[key];
    },
  }) as unknown as ConfigService;

describe("R2StorageAdapter", () => {
  it("builds the public URL under the CDN base, trimming trailing slashes", () => {
    const adapter = new R2StorageAdapter(
      configWith({ HOBOM_R2_PUBLIC_BASE_URL: "https://cdn.hobom/" }),
    );
    expect(adapter.publicUrl("animals/abc.jpg")).toBe(
      "https://cdn.hobom/animals/abc.jpg",
    );
  });

  it("presigns a PUT via the S3 presigner", async () => {
    const adapter = new R2StorageAdapter(
      configWith({
        HOBOM_R2_BUCKET: "bucket",
        HOBOM_R2_ENDPOINT: "https://acc.r2.cloudflarestorage.com",
        HOBOM_R2_ACCESS_KEY_ID: "id",
        HOBOM_R2_SECRET_ACCESS_KEY: "secret",
      }),
    );
    const url = await adapter.presignUpload({
      objectKey: "animals/abc.jpg",
      contentType: "image/jpeg",
      expiresInSeconds: 300,
    });
    expect(url).toBe("https://r2/presigned-put");
  });
});
