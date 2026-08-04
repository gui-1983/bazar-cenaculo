/* Selo circular azul com o pássaro do Cenáculo. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="grid flex-none place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(150deg,#4aa0e2,#2c78bd)",
        boxShadow: "0 6px 16px -6px rgba(44,120,189,.55)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-bird.png" alt="" aria-hidden="true" style={{ width: "56%", height: "auto" }} />
    </span>
  );
}
