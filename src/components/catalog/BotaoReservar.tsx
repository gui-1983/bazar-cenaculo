"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

type Estado = "idle" | "carregando" | "ok" | "indisponivel";

export function BotaoReservar({ codigo, waLink }: { codigo: string; waLink: string }) {
  const [estado, setEstado] = useState<Estado>("idle");

  async function reservar() {
    setEstado("carregando");
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb.rpc("reservar_cliente", { p_codigo: codigo });
      if (!error && data === "indisponivel") { setEstado("indisponivel"); return; }
      // ok, ou falha na função: não bloqueia o contato — abre o WhatsApp mesmo assim
      setEstado("ok");
      window.open(waLink, "_blank", "noopener");
    } catch {
      setEstado("ok");
      window.open(waLink, "_blank", "noopener");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rounded-xl border border-[#f4e2bd] bg-res-bg p-4 text-center">
        <div className="font-display text-[15px] font-semibold text-res">🟡 Reserva registrada!</div>
        <p className="mt-1 text-[13px] text-muted">
          Combine a retirada pelo WhatsApp. Você tem <b>48 horas</b> para retirar — depois disso a
          reserva é liberada para outra pessoa.
        </p>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[13.5px] font-semibold text-green-600 underline underline-offset-2">
          Reabrir o WhatsApp
        </a>
      </div>
    );
  }

  if (estado === "indisponivel") {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-center text-[13.5px] text-muted">
        Poxa! Este item acabou de ser reservado por outra pessoa. Dê uma olhada em outros produtos disponíveis. 💛
      </div>
    );
  }

  return (
    <>
      <Button onClick={reservar} disabled={estado === "carregando"} variant="whatsapp" size="lg" className="w-full">
        {estado === "carregando" ? "Reservando…" : "🟢 Reservar pelo WhatsApp"}
      </Button>
      <p className="mt-2 text-center text-[12.5px] text-muted">
        Ao reservar, o item fica separado no seu nome por <b>48 horas</b> para retirada.
      </p>
    </>
  );
}
