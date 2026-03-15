import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts']
  }
];
