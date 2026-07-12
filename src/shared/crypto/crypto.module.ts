import { Global, Module } from "@nestjs/common";
import { FieldCipher } from "src/shared/crypto/field-cipher";
import { PasswordHasher } from "src/shared/crypto/password-hasher";

@Global()
@Module({
  providers: [FieldCipher, PasswordHasher],
  exports: [FieldCipher, PasswordHasher],
})
export class CryptoModule {}
