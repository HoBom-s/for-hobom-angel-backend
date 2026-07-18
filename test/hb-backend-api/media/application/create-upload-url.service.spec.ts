import { BadRequestException } from "@nestjs/common";
import { UploadPurpose } from "src/hb-backend-api/media/domain/enums/upload-purpose.enum";
import { CreateUploadUrlService } from "src/hb-backend-api/media/application/use-cases/create-upload-url.service";
import { ObjectStoragePort } from "src/hb-backend-api/media/domain/ports/out/object-storage.port";

describe("CreateUploadUrlService", () => {
  let storage: jest.Mocked<ObjectStoragePort>;
  let service: CreateUploadUrlService;

  beforeEach(() => {
    storage = {
      presignUpload: jest.fn().mockResolvedValue("https://r2/put?sig=abc"),
      publicUrl: jest.fn((key: string) => `https://cdn.hobom/${key}`),
    };
    service = new CreateUploadUrlService(storage);
  });

  it("generates a key, presigns it, and returns the upload + public URLs", async () => {
    const result = await service.invoke({
      purpose: UploadPurpose.ANIMAL,
      contentType: "image/jpeg",
      uploaderId: "user-1",
    });

    expect(result.objectKey).toMatch(/^animals\/.+\.jpg$/);
    expect(result.uploadUrl).toBe("https://r2/put?sig=abc");
    expect(result.publicUrl).toBe(`https://cdn.hobom/${result.objectKey}`);
    expect(result.expiresInSeconds).toBe(300);
    expect(storage.presignUpload).toHaveBeenCalledWith({
      objectKey: result.objectKey,
      contentType: "image/jpeg",
      expiresInSeconds: 300,
    });
  });

  it("rejects a disallowed content type before touching storage", async () => {
    await expect(
      service.invoke({
        purpose: UploadPurpose.ANIMAL,
        contentType: "image/gif",
        uploaderId: "user-1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.presignUpload).not.toHaveBeenCalled();
  });
});
