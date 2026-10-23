import { createHash, randomBytes } from "node:crypto";

export function newApiKey() {
  const key = `sk_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(key).digest("hex");

  return { key, hash };
}

export function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}
