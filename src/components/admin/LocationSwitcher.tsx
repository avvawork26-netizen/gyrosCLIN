"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocation } from "@/app/admin/(panel)/location-actions";
import type { Location } from "@/lib/locations";

// Segmented buttons to switch the active location. Big tap targets, flat UI.
export default function LocationSwitcher({
  locations,
  selectedId,
}: {
  locations: Location[];
  selectedId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (locations.length === 0) return null;

  function pick(id: string) {
    if (id === selectedId || pending) return;
    start(async () => {
      await setLocation(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="Location">
      {locations.map((l) => {
        const active = l.id === selectedId;
        return (
          <button
            key={l.id}
            onClick={() => pick(l.id)}
            disabled={pending}
            className={`px-3 py-2 text-sm border ${
              active
                ? "bg-burnt text-bone border-burnt"
                : "bg-oxblood2 text-muted border-line hover:text-bone"
            } disabled:opacity-60`}
          >
            {l.name}
          </button>
        );
      })}
    </div>
  );
}
