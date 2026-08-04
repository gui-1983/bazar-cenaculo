import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-[1120px] place-items-center px-[22px] text-center">
      <div>
        <div className="text-5xl">🫙</div>
        <h1 className="mt-4 font-display text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-muted">O item que você procura pode ter sido reservado ou removido.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/">Voltar ao início</Button>
          <Button href="/produtos" variant="outline">Ver produtos</Button>
        </div>
      </div>
    </div>
  );
}
