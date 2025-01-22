const shared = require("../shared-config/tailwind.config");

module.exports = {
  // Spread the shared configuration into this plugin’s config
  ...shared,

  // Optionally override or extend the shared content globs
  content: [
    ...shared.content,
    "./src/**/*.{js,jsx,ts,tsx}",
    // etc.
  ],

  // If your plugin requires additional theme or plugin overrides:
  theme: {
    ...shared.theme,
    extend: {
      // plugin-specific overrides
    },
  },
  plugins: [
    ...shared.plugins,
    // plugin-specific plugins
  ],
};
