// Base flat config
import js from "@eslint/js";
import tsEslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    name: "base:plugins+rules",
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": false
        },
      ],
      "unused-imports/no-unused-imports": "error",
      "import/order": ["error", {
        "alphabetize": { "order": "asc", "caseInsensitive": true },
        "newlines-between": "always"
      }]
    }
  },
  prettier
];