"use client";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Registra 1 acesso por carregamento de página do site público.
// Não conta acessos ao painel administrativo (/admin).
export function RegistrarAcesso() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return;
    supabaseBrowser()
      .rpc("registrar_acesso")
      .then(
        () => {},
        () => {} // silencioso: se a função ainda não existir, não quebra o site
      );
  }, []);
  return null;
}
