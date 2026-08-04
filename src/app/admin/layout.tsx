export const metadata = { title: "Painel", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1120px] px-[22px] py-6">{children}</div>;
}
