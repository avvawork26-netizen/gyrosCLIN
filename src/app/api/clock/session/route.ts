import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSession } from "@/lib/clock";
import { signClockToken } from "@/lib/clockToken";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5;

// Validates an employee's PIN. On success returns a signed token + session
// data. Enforces the lockout policy: 5 failed attempts -> 5 minute lock.
export async function POST(req: Request) {
  let body: { employee_id?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { employee_id, pin } = body;
  if (!employee_id || !pin || !/^[0-9]{4}$/.test(pin)) {
    return NextResponse.json({ error: "Enter your 4-digit PIN" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: emp } = await admin
    .from("employees")
    .select("id, name, pin, is_active, failed_attempts, locked_until")
    .eq("id", employee_id)
    .maybeSingle();

  // Don't reveal whether the employee exists / is active.
  if (!emp || !emp.is_active) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  const now = Date.now();
  const lockedUntil = emp.locked_until ? new Date(emp.locked_until).getTime() : 0;
  if (lockedUntil > now) {
    const mins = Math.ceil((lockedUntil - now) / 60000);
    return NextResponse.json(
      { error: "locked", lockedMinutes: mins },
      { status: 423 }
    );
  }

  // Correct PIN — clear any failed-attempt state and issue a token.
  if (pin === emp.pin) {
    if (emp.failed_attempts !== 0 || emp.locked_until) {
      await admin
        .from("employees")
        .update({ failed_attempts: 0, locked_until: null })
        .eq("id", emp.id);
    }
    const session = await buildSession(admin, { id: emp.id, name: emp.name });
    const token = signClockToken(emp.id);
    return NextResponse.json({ token, session });
  }

  // Wrong PIN — count it, lock out at the threshold.
  const attempts = (emp.failed_attempts ?? 0) + 1;
  if (attempts >= MAX_ATTEMPTS) {
    const lockUntilIso = new Date(now + LOCK_MINUTES * 60000).toISOString();
    await admin
      .from("employees")
      .update({ failed_attempts: 0, locked_until: lockUntilIso })
      .eq("id", emp.id);
    return NextResponse.json(
      { error: "locked", lockedMinutes: LOCK_MINUTES },
      { status: 423 }
    );
  }

  await admin
    .from("employees")
    .update({ failed_attempts: attempts })
    .eq("id", emp.id);
  return NextResponse.json(
    { error: "Wrong PIN", attemptsLeft: MAX_ATTEMPTS - attempts },
    { status: 401 }
  );
}
