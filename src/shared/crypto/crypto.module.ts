import { Global, Module } from "@nestjs/common";
import { FieldCipher } from "src/shared/crypto/field-cipher";

@Global()
@Module({
  providers: [FieldCipher],
  exports: [FieldCipher],
})
export class CryptoModule {}
