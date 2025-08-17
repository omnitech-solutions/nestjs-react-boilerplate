import nodeConfig from "@nestjs-react-boilerplate/config/eslint/node";

export default [
    ...nodeConfig,
    {
        ignores: [
            "dist/**",
            "coverage/**",
            "node_modules/**",
        ],
    },
];