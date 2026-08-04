"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { config } from "@/lib/config";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(null);
    setCarregando(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha incorretos. Tente novamente.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-[420px] place-items-center px-[22px]">
      <div className="w-full">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-green font-display text-lg font-bold text-white">C</span>
          <h1 className="font-display text-2xl font-semibold">Área restrita da casa</h1>
          <p className="mt-1 text-sm text-muted">{config.instituicao}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6">
          <label className="mb-1.5 block text-[13.5px] font-semibold">E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
            className="mb-4 w-full rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-green"
            placeholder="voce@exemplo.org.br" />
          <label className="mb-1.5 block text-[13.5px] font-semibold">Senha</label>
          <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password"
            onKeyDown={(e) => e.key === "Enter" && entrar()}
            className="mb-4 w-full rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-green"
            placeholder="••••••••" />
          {erro && <p className="mb-3 text-sm text-vend">{erro}</p>}
          <Button onClick={entrar} disabled={carregando} className="w-full">
            {carregando ? "Entrando…" : "Entrar"}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Acesso só para a equipe da casa. O login e a senha são criados pela coordenação no Supabase → Authentication.
        </p>
      </div>
    </div>
  );
}
