/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest:  { 50:"#f0fdf4", 100:"#dcfce7", 200:"#bbf7d0", 300:"#86efac", 400:"#4ade80", 500:"#22c55e", 600:"#16a34a", 700:"#15803d", 800:"#166534", 900:"#14532d", 950:"#052e16" },
        slate:   { 50:"#f8fafc", 100:"#f1f5f9", 200:"#e2e8f0", 300:"#cbd5e1", 400:"#94a3b8", 500:"#64748b", 600:"#475569", 700:"#334155", 800:"#1e293b", 900:"#0f172a", 950:"#020617" },
        amber:   { 50:"#fffbeb", 300:"#fcd34d", 400:"#fbbf24", 500:"#f59e0b", 600:"#d97706" },
        rose:    { 400:"#fb7185", 500:"#f43f5e", 600:"#e11d48" },
        sky:     { 400:"#38bdf8", 500:"#0ea5e9" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn .3s ease-out",
        "slide-up": "slideUp .4s ease-out",
        "pulse-green": "pulseGreen 2s infinite",
      },
      keyframes: {
        fadeIn:     { from:{ opacity:"0" }, to:{ opacity:"1" } },
        slideUp:    { from:{ opacity:"0", transform:"translateY(16px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        pulseGreen: { "0%,100%":{ boxShadow:"0 0 0 0 rgba(34,197,94,.4)" }, "50%":{ boxShadow:"0 0 0 8px rgba(34,197,94,0)" } },
      },
    },
  },
  plugins: [],
};
