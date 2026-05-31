import crypto from "crypto";

// A random 4-digit PIN as a zero-padded string ("0000".."9999").
export function randomPin(): string {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}
