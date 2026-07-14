import type { Config } from "tailwindcss";
const preset = require("../../packages/shared/tailwind-preset.js");

const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}"
  ]
};
export default config;
