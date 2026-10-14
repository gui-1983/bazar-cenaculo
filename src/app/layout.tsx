import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RegistrarAcesso } from "@/components/site/RegistrarAcesso";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: `${config.nomeSite} · ${config.instituicao}`,
    template: `%s · ${config.nomeSite}`,
  },
  description: config.descricao,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: config.nomeSite,
    title: `${config.nomeSite} · ${config.instituicao}`,
    description: config.descricao,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <RegistrarAcesso />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
