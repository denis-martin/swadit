// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'dist/',
            'node_modules/',
            '.angular/',
            'src/assets/',
            'src/polyfills.ts',
        ],
    },
    {
        files: ['**/*.ts'],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        rules: {
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/no-inferrable-types': 0,
            '@typescript-eslint/no-this-alias': 1,
            'no-prototype-builtins': 1,
            '@typescript-eslint/no-empty-function': 1,
            '@typescript-eslint/no-unsafe-function-type': 1,
            '@typescript-eslint/no-wrapper-object-types': 1,
            '@typescript-eslint/no-empty-object-type': 1,
            '@typescript-eslint/no-unused-vars': 1,
        },
    },
);
