"use client";
import { useState } from "react";

export function Galeria({ imagens, alt }: { imagens: string[]; alt: string }) {
  const [atual, setAtual] = useState(0);
  const principal = imagens[atual] ?? imagens[0];

  return (
    <div>
      <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-[18px] border border-line bg-surface p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={principal} alt={alt} className="max-h-[520px] w-auto max-w-full" />
      </div>

      {imagens.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {imagens.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`overflow-hidden rounded-lg border-2 transition-colors ${
                i === atual ? "border-[#368FD9]" : "border-line hover:border-[#9cc7e8]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
