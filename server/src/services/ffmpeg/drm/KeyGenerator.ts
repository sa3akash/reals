// services/KeyGenerator.ts
import { randomBytes } from "crypto";

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}
function formatGUID(hex32: string): string {
  return `${hex32.substring(0,8)}-${hex32.substring(8,4)}-${hex32.substring(12,4)}-${hex32.substring(16,4)}-${hex32.substring(20)}`;
}
export function generateDRMKeys() {
  const kidHex = randomHex(16);
  const keyHex = randomHex(16);
  return { keyId: kidHex, key: keyHex, kidGUID: formatGUID(kidHex) };
}
