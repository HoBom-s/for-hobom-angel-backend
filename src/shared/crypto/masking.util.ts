/**
 * Response-time masking for PII. Applied when mapping decrypted
 * values into DTOs so raw name/phone/email never leave the service unmasked
 * (unmasked reads are an audited privileged action).
 */
export function maskName(name: string): string {
  if (name.length <= 1) {
    return name;
  }
  if (name.length === 2) {
    return `${name[0]}*`;
  }
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) {
    return "*".repeat(digits.length);
  }
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) {
    return "*".repeat(email.length);
  }
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}
