"use client";

import type { Location } from "@/lib/locations";

// First step of the clock-in screen: choose which restaurant you're at.
export default function LocationPicker({
  locations,
  loading,
  error,
  onPick,
}: {
  locations: Location[];
  loading: boolean;
  error: string | null;
  onPick: (l: Location) => void;
}) {
  if (loading) {
    return <p className="text-muted">Loading locations...</p>;
  }
  if (error) {
    return (
      <div className="border border-danger text-danger px-3 py-2">{error}</div>
    );
  }
  if (locations.length === 0) {
    return <p className="text-muted">No locations configured.</p>;
  }
  return (
    <div>
      <p className="text-muted mb-3">Select your location</p>
      <div className="grid grid-cols-1 gap-3">
        {locations.map((l) => (
          <button
            key={l.id}
            onClick={() => onPick(l)}
            className="btn bg-oxblood2 border border-line py-6 text-lg active:bg-oxblood text-left"
          >
            {l.name}
          </button>
        ))}
      </div>
    </div>
  );
}
