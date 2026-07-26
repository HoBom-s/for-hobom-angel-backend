import { NotFoundException } from "@nestjs/common";
import { VerifyCertificateService } from "src/hb-backend-api/volunteer/application/use-cases/verify-certificate.service";

describe("VerifyCertificateService", () => {
  const build = (found: unknown) => {
    const queryPort = {
      findByCertificateNo: jest.fn().mockResolvedValue(found),
      findByUser: jest.fn(),
    };
    return new VerifyCertificateService(queryPort);
  };

  it("404s an unknown certificate number", async () => {
    await expect(build(null).invoke("VC-nope")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("returns the certificate for a valid number", async () => {
    const cert = { getCertificateNo: "VC-ok" };
    expect(await build(cert).invoke("VC-ok")).toBe(cert);
  });
});
