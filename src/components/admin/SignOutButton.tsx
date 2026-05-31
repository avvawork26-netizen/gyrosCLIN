"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="text-muted text-xs uppercase tracking-wide hover:text-bone"
    >
      Sign out
    </button>
  );
}
