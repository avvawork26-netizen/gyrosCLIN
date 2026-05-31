import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Flat, solid palette. No gradients.
        ink: "#000000", // black background
        oxblood: "#1a0000", // deep dark red
        oxblood2: "#2a0505", // slightly lighter panel red
        burnt: "#cc5200", // burnt orange accent
        burntdark: "#a84300", // pressed accent
        bone: "#f2efe9", // off-white text
        muted: "#8a7f78", // muted off-white
        line: "#3a1414", // borders
        danger: "#e02a2a",
        ok: "#2f9e44",
      },
      borderRadius: {
        // Keep corners square / minimal. No pills.
        none: "0px",
        sm: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
