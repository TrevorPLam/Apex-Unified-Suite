import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.base.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      // TypeScript recommended rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      
      // Cross-context import restrictions - CI-001.2
      'import/no-restricted-imports': [
        'error',
        {
          // Prevent direct imports between bounded contexts
          patterns: [
            // Finance cannot import CRM internals
            {
              group: ['@workspace/apex-os/src/pages/crm/**'],
              message: 'Finance context should not import CRM internals. Use API layer instead.',
            },
            // CRM cannot import Finance internals  
            {
              group: ['@workspace/apex-os/src/pages/finance/**'],
              message: 'CRM context should not import Finance internals. Use API layer instead.',
            },
            // Projects cannot import CRM internals
            {
              group: ['@workspace/apex-os/src/pages/crm/**'],
              message: 'Projects context should not import CRM internals. Use API layer instead.',
            },
            // CRM cannot import Projects internals
            {
              group: ['@workspace/apex-os/src/pages/projects/**'],
              message: 'CRM context should not import Projects internals. Use API layer instead.',
            },
            // Documents cannot import Assets internals
            {
              group: ['@workspace/apex-os/src/pages/assets/**'],
              message: 'Documents context should not import Assets internals. Use API layer instead.',
            },
            // Assets cannot import Documents internals
            {
              group: ['@workspace/apex-os/src/pages/documents/**'],
              message: 'Assets context should not import Documents internals. Use API layer instead.',
            },
            // Portal cannot import other context internals
            {
              group: ['@workspace/apex-os/src/pages/crm/**', '@workspace/apex-os/src/pages/projects/**', '@workspace/apex-os/src/pages/finance/**'],
              message: 'Portal context should not import other business context internals. Use API layer instead.',
            },
            // Analytics cannot import business context internals (should use aggregated data)
            {
              group: ['@workspace/apex-os/src/pages/crm/**', '@workspace/apex-os/src/pages/projects/**', '@workspace/apex-os/src/pages/finance/**', '@workspace/apex-os/src/pages/documents/**', '@workspace/apex-os/src/pages/assets/**'],
              message: 'Analytics context should not import business context internals. Use API layer instead.',
            },
            // Settings cannot import business context internals
            {
              group: ['@workspace/apex-os/src/pages/crm/**', '@workspace/apex-os/src/pages/projects/**', '@workspace/apex-os/src/pages/finance/**', '@workspace/apex-os/src/pages/documents/**', '@workspace/apex-os/src/pages/assets/**', '@workspace/apex-os/src/pages/portal/**'],
              message: 'Settings context should not import business context internals. Use API layer instead.',
            },
          ],
          // Allow imports from shared infrastructure
          except: [
            // Shared components and utilities are allowed
            '@workspace/apex-os/src/components/**',
            '@workspace/apex-os/src/lib/**',
            '@workspace/apex-os/src/hooks/**',
            '@workspace/apex-os/src/contexts/**',
            '@workspace/apex-os/src/data/**',
            // API client is allowed (cross-context communication layer)
            '@workspace/api-client-react/**',
            '@workspace/api-zod/**',
            // Database layer is allowed (shared infrastructure)
            '@workspace/db/**',
            // Type definitions are allowed
            '@workspace/api-spec/**',
          ],
        },
      ],
      
      // General import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'warn',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  // Override for test files - allow more imports for testing
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*'],
    rules: {
      'import/no-restricted-imports': 'off', // Allow any imports in tests
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
    },
  },
  // Override for configuration files
  {
    files: ['**/*.config.js', '**/*.config.ts', 'vite.config.ts'],
    rules: {
      'import/no-restricted-imports': 'off', // Allow any imports in configs
    },
  },
];
