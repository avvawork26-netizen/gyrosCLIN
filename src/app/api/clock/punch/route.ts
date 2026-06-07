import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSession } from "@/lib/clock";
import { verifyClockToken, signClockToken } from "@/lib/clockToken";

export const dynamic = "force-dynamic";

// Clock in or clock out, authorized by the short-lived token issued after a
// correct PIN. Supports multiple punches per day (lunch breaks).
export async function POST(req: Request) {
  let body: { token?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { token, action } = body;
  const validActions = ["in", "out", "lunch", "return"];
  if (!token || !action || !validActions.includes(action)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const employeeId = token ? verifyClockToken(token) : null;
  if (!employeeId) {
    return NextResponse.json(
      { error: "Session expired. Enter your PIN again." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data: emp } = await admin
    .from("employees")
    .select("id, name, is_active, location_id")
    .eq("id", employeeId)
    .maybeSingle();
  if (!emp || !emp.is_active) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }

  // Current open punch, if any.
  const { data: openRows } = await admin
    .from("punches")
    .select("id")
    .eq("employee_id", emp.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1);
  const open = openRows?.[0] ?? null;
  const nowIso = new Date().toISOString();

  if (action === "in") {
    if (open) {
      return NextResponse.json(
        { error: "You are already clocked in" },
        { status: 409 }
      );
    }
    const { error } = await admin
      .from("punches")
      .insert({
        employee_id: emp.id,
        location_id: emp.location_id,
        clock_in: nowIso,
      });
    if (error) {
      return NextResponse.json({ error: "Could not clock in" }, { status: 500 });
    }
  } else if (action === "out") {
    if (!open) {
      return NextResponse.json(
        { error: "You are not clocked in" },
        { status: 409 }
      );
    }
    const { error } = await admin
      .from("punches")
      .update({ clock_out: nowIso })
      .eq("id", open.id);
    if (error) {
      return NextResponse.json({ error: "Could not clock out" }, { status: 500 });
    }
  } else {
    // 'lunch' or 'return' — a status flag on the open punch. The clock keeps
    // running; no time is deducted.
    if (!open) {
      return NextResponse.json(
        { error: "You are not clocked in" },
        { status: 409 }
      );
    }
    const { error } = await admin
      .from("punches")
      .update({ status: action === "lunch" ? "lunch" : "active" })
      .eq("id", open.id);
    if (error) {
      return NextResponse.json(
        { error: "Could not update status" },
        { status: 500 }
      );
    }
  }

  const session = await buildSession(admin, { id: emp.id, name: emp.name });
  // Refresh the token so an active employee isn't logged out mid-shift.
  return NextResponse.json({ token: signClockToken(emp.id), session });
}
