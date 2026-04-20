/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: '#F8F9FB',
        dark: '#1A1C1E',
        accent: '#D9F217',
      },
    },
  },
  plugins: [],
}
