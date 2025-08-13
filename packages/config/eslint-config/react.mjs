import base from "./index.mjs";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  // shared base (ts/js, import ordering, prettier last)
  ...base,

  // React/web defaults
  {
    name: "env:react",
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y
    },
    settings: { react: { version: "detect" } },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
      // browser globals are provided by rules/plugins; add here if you need explicit globals
      // globals: { window: "readonly", document: "readonly" }
    },
    rules: {
      // plugin recommended rules (classic configs) applied explicitly for flat config
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules
    }
  },

  // Test-only relaxations for web (underscore-args allowed, any allowed)
  {
    name: "overrides:web-tests",
    files: [
      "test/**/*.{ts,tsx}",
      "src/**/*.{spec,test,e2e,e2e-spec}.{ts,tsx}"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    }
  }
];