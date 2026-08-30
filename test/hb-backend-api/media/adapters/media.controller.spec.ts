import { UploadPurpose } from "src/hb-backend-api/media/domain/enums/upload-purpose.enum";
import { CreateUploadUrlUseCase } from "src/hb-backend-api/media/domain/ports/in/create-upload-url.use-case";
import { MediaController } from "src/hb-backend-api/media/adapters/in/media.controller";
import { AuthenticatedUser } from "src/shared/auth/authenticated-user";

describe("MediaController", () => {
  it("delegates to the use-case with the current user as uploader", async () => {
    const result = {
      objectKey: "animals/x.jpg",
      uploadUrl: "https://r2/put",
      expiresInSeconds: 300,
      publicUrl: "https://cdn/animals/x.jpg",
    };
    const useCase: jest.Mocked<CreateUploadUrlUseCase> = {
      invoke: jest.fn().mockResolvedValue(result),
    };
    const controller = new MediaController(useCase);

    const res = await controller.createUploadUrl(
      { userId: "user-1" } as AuthenticatedUser,
      { purpose: UploadPurpose.ANIMAL, contentType: "image/jpeg" },
    );

    expect(res).toBe(result);
    expect(useCase.invoke).toHaveBeenCalledWith({
      purpose: UploadPurpose.ANIMAL,
      contentType: "image/jpeg",
      uploaderId: "user-1",
    });
  });
});
