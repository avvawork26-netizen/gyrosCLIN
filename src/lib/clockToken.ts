import crypto from "crypto";

// Short-lived signed token issued after a correct PIN entry, so the employee
// can clock in/out without re-typing their PIN on every tap. Server-only.
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function secret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return s;
}

export function signClockToken(employeeId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${employeeId}.${exp}`;
  const sig = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

// Returns the employee id if the token is valid and unexpired, else null.
export function verifyClockToken(token: string): string | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const payload = Buffer.from(body, "base64url").toString("utf8");
    const expected = crypto
      .createHmac("sha256", secret())
      .update(payload)
      .digest("base64url");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
    const [employeeId, expStr] = payload.split(".");
    if (Date.now() > Number(expStr)) return null;
    return employeeId;
  } catch {
    return null;
  }
}
