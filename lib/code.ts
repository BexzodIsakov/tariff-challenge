import "server-only";
import { randomBytes } from "crypto";

export function generateActivationCode(): string {
  return randomBytes(6).toString("hex").toUpperCase();
}
