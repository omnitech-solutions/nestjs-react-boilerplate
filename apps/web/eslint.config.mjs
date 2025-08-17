import reactConfig from "@nestjs-react-boilerplate/config/eslint/react";


export default [
    ...reactConfig,
    {
        ignores: [
            "dist/**",
            "coverage/**",
            "node_modules/**",
        ],
    },
];