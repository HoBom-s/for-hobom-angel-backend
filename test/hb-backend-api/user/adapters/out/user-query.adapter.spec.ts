import { Test } from "@nestjs/testing";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserQueryAdapter } from "src/hb-backend-api/user/adapters/out/user-query.adapter";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";

const doc = (over: Partial<UserEntity> = {}): UserEntity =>
  ({
    _id: new Types.ObjectId(),
    nickname: "hobom",
    email: "hobom@example.com",
    ci: "ci-value",
    verifiedChannel: VerifiedChannel.PHONE,
    roles: [UserRole.USER],
    shelterRoles: [],
    status: UserStatus.ACTIVE,
    withdrawnAt: null,
    purgeAfter: null,
    ...over,
  }) as unknown as UserEntity;

const makeAdapter = async (repo: Record<string, jest.Mock>) => {
  const module = await Test.createTestingModule({
    providers: [
      UserQueryAdapter,
      { provide: DIToken.UserModule.UserRepository, useValue: repo },
    ],
  }).compile();
  return module.get(UserQueryAdapter);
};

describe("UserQueryAdapter", () => {
  it("maps a found document, returns null when missing", async () => {
    const repo = {
      findByNickname: jest.fn().mockResolvedValue(doc()),
      findByCi: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
    };
    const adapter = await makeAdapter(repo);

    expect((await adapter.findByNickname("hobom"))?.getNickname.raw).toBe(
      "hobom",
    );
    expect(await adapter.findByCi("missing")).toBeNull();
  });

  it("findById passes the raw ObjectId to the repository", async () => {
    const id = new Types.ObjectId();
    const repo = {
      findById: jest.fn().mockResolvedValue(doc({ _id: id })),
      findByNickname: jest.fn(),
      findByCi: jest.fn(),
    };
    const adapter = await makeAdapter(repo);

    const user = await adapter.findById(UserId.fromString(id.toHexString()));
    expect(user?.getId.toString()).toBe(id.toHexString());
    expect(repo.findById.mock.calls[0][0].toHexString()).toBe(id.toHexString());
  });
});
