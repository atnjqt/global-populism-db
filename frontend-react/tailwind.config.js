/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff5f2',
          100: '#ffe6df',
          200: '#ffc9b8',
          300: '#ffa082',
          400: '#ff6b35',
          500: '#e63946',
          600: '#d62839',
          700: '#b31d2e',
          800: '#941a28',
          900: '#7a1a25',
        },
      },
    },
  },
  plugins: [],
}
