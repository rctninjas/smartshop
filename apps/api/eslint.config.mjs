import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**']
  }
];
