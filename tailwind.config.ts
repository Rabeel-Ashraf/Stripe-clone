import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stripe: {
          blue: "#635BFF",
          success: "#31A24C",
          danger: "#FA5252",
          warning: "#FFA500",
        },
      },
    },
  },
  plugins: [],
}
export default config
