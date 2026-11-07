/**
 * src/modules/audit/helpers/redact.ts
 * Utilitas redaksi data sensitif untuk jejak audit (audit_logs).
 * Mencegah data kredensial, rahasia, atau privasi tersimpan di basis data.
 */

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "password_hash",
  "passwordhash",
  "token",
  "rawtoken",
  "tokenhash",
  "secret",
  "secretkey",
  "nik",
  "rekening",
  "nomor_rekening",
  "nomorrekening",
  "credit_card",
  "creditcard",
  "pin",
  "cvv",
  "two_factor_secret",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, "");
  return SENSITIVE_KEY_PATTERNS.some((pattern) => {
    const normPattern = pattern.replace(/[-_]/g, "");
    return normalized.includes(normPattern);
  });
}

export function redactSensitiveData(val: unknown): unknown {
  if (val === null || val === undefined) {
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => redactSensitiveData(item));
  }

  if (typeof val === "object") {
    const redactedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        redactedObj[k] = "[REDACTED]";
      } else if (typeof v === "object" && v !== null) {
        redactedObj[k] = redactSensitiveData(v);
      } else {
        redactedObj[k] = v;
      }
    }
    return redactedObj;
  }

  return val;
}
