"use client";

import { useEffect, useState } from "react";
import type { PublicEmployee, SessionData } from "@/lib/types";
import type { Location } from "@/lib/locations";
import LocationPicker from "@/components/public/LocationPicker";
import EmployeePicker from "@/components/public/EmployeePicker";
import PinPad from "@/components/public/PinPad";
import ClockDashboard from "@/components/public/ClockDashboard";

type Stage = "location" | "pick" | "pin" | "dash";

export default function Home() {
  const [stage, setStage] = useState<Stage>("location");

  const [locations, setLocations] = useState<Location[]>([]);
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);

  const [employees, setEmployees] = useState<PublicEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selected, setSelected] = useState<PublicEmployee | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [dashError, setDashError] = useState<string | null>(null);

  async function loadLocations() {
    setLocLoading(true);
    setLocError(null);
    try {
      const res = await fetch("/api/locations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setLocations(data.locations);
    } catch {
      setLocError("Could not load locations. Check your connection.");
    } finally {
      setLocLoading(false);
    }
  }

  async function loadEmployees(locationId: string) {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch(
        `/api/employees/active?location=${encodeURIComponent(locationId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEmployees(data.employees);
    } catch {
      setListError("Could not load staff. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, []);

  function pickLocation(l: Location) {
    setLocation(l);
    setEmployees([]);
    setStage("pick");
    loadEmployees(l.id);
  }

  function changeLocation() {
    setLocation(null);
    setSelected(null);
    setStage("location");
  }

  function pick(e: PublicEmployee) {
    setSelected(e);
    setPinError(null);
    setStage("pin");
  }

  function backToList() {
    setSelected(null);
    setPinError(null);
    setStage("pick");
  }

  async function submitPin(pin: string) {
    if (!selected) return;
    setBusy(true);
    setPinError(null);
    try {
      const res = await fetch("/api/clock/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: selected.id, pin }),
      });
      const data = await res.json();
      if (res.status === 423) {
        setPinError(
          `Locked out. Try again in ${data.lockedMinutes} minute${
            data.lockedMinutes === 1 ? "" : "s"
          }.`
        );
        return;
      }
      if (!res.ok) {
        const left =
          typeof data.attemptsLeft === "number"
            ? ` ${data.attemptsLeft} attempt${
                data.attemptsLeft === 1 ? "" : "s"
              } left.`
            : "";
        setPinError((data.error || "Wrong PIN") + left);
        return;
      }
      setToken(data.token);
      setSession(data.session);
      setDashError(null);
      setStage("dash");
    } catch {
      setPinError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function punch(action: "in" | "out" | "lunch" | "return") {
    if (!token) return;
    setBusy(true);
    setDashError(null);
    try {
      const res = await fetch("/api/clock/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();
      if (res.status === 401) {
        // Token expired — bounce back to PIN entry.
        setDashError(null);
        setToken(null);
        setSession(null);
        setPinError(data.error || "Session expired. Enter your PIN again.");
        setStage("pin");
        return;
      }
      if (!res.ok) {
        setDashError(data.error || "Something went wrong");
        return;
      }
      setToken(data.token);
      setSession(data.session);
    } catch {
      setDashError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function finishSession() {
    setToken(null);
    setSession(null);
    setSelected(null);
    setStage("pick");
    if (location) loadEmployees(location.id);
  }

  return (
    <main className="min-h-dvh p-5">
      <header className="mx-auto max-w-md mb-6 border-b border-line pb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-burnt">MR GYROS</span>{" "}
          <span className="text-muted text-base font-normal">Time Clock</span>
        </h1>
        {location && (
          <p className="text-muted text-sm mt-1">{location.name}</p>
        )}
      </header>

      {stage === "location" && (
        <div className="mx-auto max-w-md">
          <LocationPicker
            locations={locations}
            loading={locLoading}
            error={locError}
            onPick={pickLocation}
          />
        </div>
      )}

      {stage === "pick" && (
        <div className="mx-auto max-w-md">
          <button
            onClick={changeLocation}
            className="text-burnt text-sm uppercase tracking-wide mb-4"
          >
            &larr; Change location
          </button>
          <EmployeePicker
            employees={employees}
            loading={loading}
            error={listError}
            onPick={pick}
          />
        </div>
      )}

      {stage === "pin" && selected && (
        <PinPad
          name={selected.name}
          onSubmit={submitPin}
          onCancel={backToList}
          busy={busy}
          error={pinError}
        />
      )}

      {stage === "dash" && session && (
        <ClockDashboard
          session={session}
          onPunch={punch}
          onDone={finishSession}
          busy={busy}
          error={dashError}
        />
      )}

      <footer className="mx-auto max-w-md mt-10 pt-4 border-t border-line">
        <a
          href="/admin"
          className="text-muted text-xs uppercase tracking-wide"
        >
          Admin
        </a>
      </footer>
    </main>
  );
}
