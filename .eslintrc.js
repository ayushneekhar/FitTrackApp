module.exports = {
  root: true, // Prevent ESLint from looking further up the directory tree
  extends: [
    "expo", // Expo's base ESLint config (includes React, React Native rules)
    "plugin:@typescript-eslint/recommended", // Recommended TypeScript rules
    // Add other ESLint configs you use here (e.g., 'airbnb', 'standard')
    "plugin:prettier/recommended", // **MUST BE LAST:** Enables eslint-plugin-prettier, uses eslint-config-prettier, and turns on prettier/prettier rule
  ],
  parser: "@typescript-eslint/parser", // Use the TypeScript parser
  plugins: [
    "@typescript-eslint",
    // Add other plugins here if needed
  ],
  rules: {
    // --- Prettier Rule ---
    // This rule is enabled by 'plugin:prettier/recommended'
    // You can configure it further here if needed, but defaults are usually fine.
    "prettier/prettier": "warn", // Show Prettier errors as warnings

    // --- Optional: Customize other ESLint rules ---
    // Example: Allow unused variables starting with '_'
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // Example: Relax rule about explicit return types for functions
    // '@typescript-eslint/explicit-function-return-type': 'off',

    // Add any other custom rule overrides here
  },
  settings: {
    react: {
      version: "detect", // Automatically detect React version
    },
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    ".expo/",
    "web-build/",
    "*.config.js", // Ignore config files if needed
    "babel.config.js",
    ".eslintrc.js",
    ".prettierrc.js",
  ],
};
