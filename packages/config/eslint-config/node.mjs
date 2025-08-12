import base from "./index.mjs";

export default [
  // shared base (TS/JS rules, import/order, prettier last)
  ...base,

  // Node env for Nest
  {
    name: "env:node",
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly"
      }
    }
  },

  // 1) Hygen templates (CJS + tiny scripts) — CWD is apps/api
  {
    name: "overrides:cjs-templates",
    files: ["_templates/**/*.{js,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/order": "off"
    }
  },

  // 2) Local scripts
  {
    name: "overrides:scripts",
    files: ["scripts/**/*.{ts,js}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  },

  // 3) Tests
  {
    name: "overrides:tests",
    files: [
      "**/*.spec.ts",
      "**/*.e2e-spec.ts",
      "test/**/*.{ts,js}"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "import/order": "off"
    }
  },

  // 4) Seeds & factories
  {
    name: "overrides:seeds-factories",
    files: [
      "src/database/seeds/**/*.ts",
      "src/database/factories/**/*.ts"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "import/order": "off"
    }
  },

  // 5) Type declaration shims
  {
    name: "overrides:types-dts",
    files: ["types/**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  },

  // 6) Infra one-offs that legitimately use `any`
  {
    name: "overrides:infra-files",
    files: [
      "src/database/data-source.ts",
      "src/database/typeorm.config.service.ts",
      "src/utils/discover-modules.ts"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];