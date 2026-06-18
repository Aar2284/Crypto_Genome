/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "rgb(var(--ink-950) / <alpha-value>)", 800: "rgb(var(--ink-900) / <alpha-value>)", 700: "rgb(var(--ink-800) / <alpha-value>)" },
        accent: "rgb(var(--accent-rgb) / <alpha-value>)", cyber: "rgb(var(--cyber-rgb) / <alpha-value>)", neon: "rgb(var(--neon-rgb) / <alpha-value>)",
      },
      fontFamily: { display: ["Rajdhani", "Inter", "sans-serif"], mono: ["DM Mono", "ui-monospace", "SFMono-Regular", "monospace"] },
      keyframes: { shimmer: { "100%": { backgroundPosition: "-200% 0" } }, "pulse-slow": { "50%": { opacity: ".5", transform: "scale(.92)" } } },
      animation: { shimmer: "shimmer 1.8s ease-in-out infinite", "pulse-slow": "pulse-slow 2.5s ease-in-out infinite" },
    },
  },
  plugins: [],
}