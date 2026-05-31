"use client";

import { useState } from "react";

// Large numeric keypad for tablet/fat-finger use. Calls onSubmit when 4
// digits are entered. Parent controls busy/error state.
export default function PinPad({
  name,
  onSubmit,
  onCancel,
  busy,
  error,
}: {
  name: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  busy: boolean;
  error: string | null;
}) {
  const [pin, setPin] = useState("");

  function press(d: string) {
    if (busy) return;
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      onSubmit(next);
      // Clear after submit so a wrong PIN starts fresh.
      setTimeout(() => setPin(""), 150);
    }
  }

  function back() {
    if (busy) return;
    setPin((p) => p.slice(0, -1));
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="mx-auto max-w-sm">
      <button
        onClick={onCancel}
        className="text-burnt text-sm uppercase tracking-wide mb-4"
      >
        &larr; Back
      </button>
      <h2 className="text-xl font-bold mb-1">{name}</h2>
      <p className="text-muted mb-4">Enter your 4-digit PIN</p>

      <div className="flex gap-3 mb-4" aria-label="PIN entry">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-5 w-5 border border-line ${
              pin.length > i ? "bg-burnt" : "bg-black"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="border border-danger text-danger px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            disabled={busy}
            className="btn bg-oxblood2 border border-line text-2xl py-6 active:bg-oxblood"
          >
            {k}
          </button>
        ))}
        <button
          onClick={back}
          disabled={busy}
          className="btn bg-black border border-line text-lg py-6"
        >
          Del
        </button>
        <button
          onClick={() => press("0")}
          disabled={busy}
          className="btn bg-oxblood2 border border-line text-2xl py-6 active:bg-oxblood"
        >
          0
        </button>
        <div />
      </div>
    </div>
  );
}
