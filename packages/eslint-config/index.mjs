import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import {FlatCompat} from '@eslint/eslintrc';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const compat = new FlatCompat({baseDirectory: __dirname});

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    {
        ignores: [
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/node_modules/**',
            '**/*.config.*',
            '**/.eslintrc.*',
            '**/_templates/**']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...compat.extends(
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended'
    ),
    {
        settings: {react: {version: 'detect'}},
        rules: {
            'prettier/prettier': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off'
        }
    }
];