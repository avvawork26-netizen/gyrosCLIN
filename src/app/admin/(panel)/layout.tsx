import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";
import LocationSwitcher from "@/components/admin/LocationSwitcher";
import { getLocationContext } from "@/lib/locationContext";

export const dynamic = "force-dynamic";

// Authenticated admin shell. Middleware also guards /admin/*, but we re-check
// here so a server render never leaks data without a session.
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { locations, selectedId } = await getLocationContext(supabase);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line p-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-burnt">MR GYROS</span>{" "}
              <span className="text-muted text-sm font-normal">Admin</span>
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-muted text-xs hidden sm:inline">
                {user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AdminNav />
            <LocationSwitcher locations={locations} selectedId={selectedId} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}
