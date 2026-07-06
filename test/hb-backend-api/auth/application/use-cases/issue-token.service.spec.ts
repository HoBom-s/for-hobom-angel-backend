import { Test } from "@nestjs/testing";
import { DIToken } from "src/shared/di/token.di";
import { IssueTokenService } from "src/hb-backend-api/auth/application/use-cases/issue-token.service";

describe("IssueTokenService", () => {
  it("issues tokens with sub=nickname and uid=userId", async () => {
    const jwtPort = {
      issueTokens: jest
        .fn()
        .mockResolvedValue({ accessToken: "a", refreshToken: "r" }),
    };
    const module = await Test.createTestingModule({
      providers: [
        IssueTokenService,
        { provide: DIToken.AuthModule.JwtAuthPort, useValue: jwtPort },
      ],
    }).compile();

    const service = module.get(IssueTokenService);
    const pair = await service.invoke("user-1", "hobom");

    expect(jwtPort.issueTokens).toHaveBeenCalledWith({
      sub: "hobom",
      uid: "user-1",
    });
    expect(pair).toEqual({ accessToken: "a", refreshToken: "r" });
  });
});
