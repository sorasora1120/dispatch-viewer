import { createHash } from "node:crypto";
/** Same as the database: encode(digest(payload, 'sha256'), 'hex') */
export function payloadHash(payload: string): string {
  return createHash("sha256").update(payload, "utf8").digest("hex");
}
