import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { RegisterUser } from "src/hb-backend-api/user/domain/model/register-user";

const validParams = {
  nickname: "hobom",
  email: "hobom@example.com",
  passwordHash: "hashed",
  realName: "홍길동",
  phone: "010-1234-5678",
};

describe("RegisterUser", () => {
  it("builds from valid params and validates through VOs", () => {
    const reg = RegisterUser.of(validParams);
    expect(reg.getNickname.raw).toBe("hobom");
    expect(reg.getPhone.raw).toBe("01012345678");
    expect(reg.getEmail.raw).toBe("hobom@example.com");
    expect(reg.getPasswordHash).toBe("hashed");
    expect(reg.getVerifiedChannel).toBe(VerifiedChannel.EMAIL); // default
    expect(reg.getRoles).toEqual([UserRole.USER]);
  });

  it("cannot be built with an invalid field", () => {
    expect(() => RegisterUser.of({ ...validParams, email: "bad" })).toThrow();
    expect(() => RegisterUser.of({ ...validParams, phone: "123" })).toThrow();
  });

  it("returns a defensive copy of roles", () => {
    const reg = RegisterUser.of(validParams);
    reg.getRoles.push(UserRole.SYSTEM_ADMIN);
    expect(reg.getRoles).toEqual([UserRole.USER]);
  });
});
