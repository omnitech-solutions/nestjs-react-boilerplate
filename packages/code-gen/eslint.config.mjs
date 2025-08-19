import nodeConfig from "@nestjs-react-boilerplate/config/eslint/node";

export default [
    // Hard ignore build artifacts for this package
    { ignores: ["dist/**", "coverage/**", "node_modules/**"] },

    // Bring in your shared node rules
    ...nodeConfig,

    // Narrow rules to TS in src only (avoids applying node JS rules to dist)
    {
        files: ["src/**/*.{ts,tsx}"],
        rules: {
            // You asked to just allow @ts-ignore
            "@typescript-eslint/ban-ts-comment": [
                "error",
                {
                    // allow plain `@ts-ignore`
                    "ts-ignore": false,
                    // keep the rest strict (feel free to loosen)
                    "ts-expect-error": "allow-with-description",
                    "ts-nocheck": true,
                    "ts-check": false,
                    "minimumDescriptionLength": 0,
                },
            ],
        },
    },
];