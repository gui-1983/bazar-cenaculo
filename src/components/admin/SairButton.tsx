"use client";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function SairButton() {
  const router = useRouter();
  async function sair() {
    await supabaseBrowser().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button onClick={sair}
      className="mt-1 w-full whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-[14.5px] font-medium text-vend transition-colors hover:bg-white">
      ↩ Sair
    </button>
  );
}
