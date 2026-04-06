import { randomBytes } from "node:crypto";

/** Generate a cryptographically random hex string */
export function generateSecret(bytes: number = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** Generate a random alphanumeric password */
export function generatePassword(length: number = 24): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join("");
}
