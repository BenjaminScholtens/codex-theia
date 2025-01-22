module.exports = {
  // Customize content globs to cover all plugin source folders if desired
  content: [
    "../../codex/src/**/*.{js,jsx,ts,tsx}",
    "../../plugin-two/src/**/*.{js,jsx,ts,tsx}",
    // ... add more plugin globs as needed
  ],
  theme: {
    extend: {
      // Shared theme overrides
    },
  },
  plugins: [
    // Example: Shadcn-style plugin
    // require("tailwindcss-animate"),
    // require("some-other-plugin"),
  ],
};
