import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        surface: "#f5f8f6",
        surface2: "#eef3f0",
        ink: "#16211c",
        muted: "#5e6b65",
        line: "#e2eae6",
        green: { DEFAULT: "#368FD9", 600: "#2c78bd", soft: "#e6f2fb" },
        accent: { DEFAULT: "#3e7bfa", soft: "#ecf2fe" },
        disp: { DEFAULT: "#1f9d6b", bg: "#e7f5ee" },
        res: { DEFAULT: "#c98a05", bg: "#fbf1da" },
        vend: { DEFAULT: "#b0413e", bg: "#f7e6e5" },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: { xl2: "16px" },
      boxShadow: { soft: "0 1px 2px rgba(22,33,28,.04), 0 8px 28px -12px rgba(22,33,28,.14)" },
    },
  },
  plugins: [],
};
export default config;
