import { Test } from "@nestjs/testing";
import { Types } from "mongoose";
import { FieldCipher } from "src/shared/crypto/field-cipher";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserPersistenceAdapter } from "src/hb-backend-api/user/adapters/out/user-persistence.adapter";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";
import { User } from "src/hb-backend-api/user/domain/model/user";

const cipher = {
  encrypt: jest.fn((s: string) => `enc(${s})`),
} as unknown as FieldCipher;

const makeAdapter = async (repo: {
  insert: jest.Mock;
  update: jest.Mock;
}): Promise<UserPersistenceAdapter> => {
  const module = await Test.createTestingModule({
    providers: [
      UserPersistenceAdapter,
      { provide: DIToken.UserModule.UserRepository, useValue: repo },
      { provide: FieldCipher, useValue: cipher },
    ],
  }).compile();
  return module.get(UserPersistenceAdapter);
};

const registration = () =>
  RegisterUser.of({
    nickname: "hobom",
    realName: "홍길동",
    passwordHash: "hashed",
    phone: "01012345678",
    email: "hobom@example.com",
    verifiedChannel: VerifiedChannel.PHONE,
  });

describe("UserPersistenceAdapter", () => {
  it("register encrypts PII and inserts the document", async () => {
    const repo = { insert: jest.fn(), update: jest.fn() };
    const adapter = await makeAdapter(repo);

    const user = await adapter.register(registration());
    expect(user).toBeInstanceOf(User);

    const inserted = repo.insert.mock.calls[0][0];
    expect(inserted.realNameEnc).toBe("enc(홍길동)");
    expect(inserted.phoneEnc).toBe("enc(01012345678)");
    expect(inserted.nickname).toBe("hobom");
    expect(inserted.roles).toContain(UserRole.USER);
    // never store plaintext PII
    expect(inserted).not.toHaveProperty("realName");
    expect(inserted).not.toHaveProperty("phone");
  });

  it("save persists authz state and never touches PII", async () => {
    const repo = { insert: jest.fn(), update: jest.fn() };
    const adapter = await makeAdapter(repo);

    const user = User.register(registration());
    const shelter = ShelterId.fromString(new Types.ObjectId().toHexString());
    user.promoteToShelterStaff(shelter);
    await adapter.save(user);

    const [, expectedVersion, patch] = repo.update.mock.calls[0];
    expect(expectedVersion).toBe(user.getVersion); // optimistic-lock guard
    expect(patch.shelterRoles).toHaveLength(1);
    expect(patch.status).toBeDefined();
    expect(patch).not.toHaveProperty("realNameEnc");
    expect(patch).not.toHaveProperty("phoneEnc");
  });
});
