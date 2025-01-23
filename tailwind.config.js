/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./codex/src/**/*.{js,jsx,ts,tsx}",
    "./browser-app/src/**/*.{js,jsx,ts,tsx}",
    "./electron-app/src/**/*.{js,jsx,ts,tsx}",
    "./workspace-ui/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // You can add custom colors here if needed
      },
    },
  },
  plugins: [],
};
