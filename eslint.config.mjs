// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import { builtinModules } from 'module';
import tseslint from 'typescript-eslint';

const nodeCoreRegex = `^(${builtinModules
  .map(m => m.replace(/\./g, '\\.'))
  .join('|')})(/|$)`;

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'sonar-project.js', 'commitlint.config.js', 'test/**/*', '**/*.spec.ts', '**/*.test.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],

            ['^node:', nodeCoreRegex],

            ['^@nestjs\\/'],
            ['^@?\\w'],

            ['^@src\\/', '^@share\\/'],

            ['^src\\/'],

            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)'],
            ['^\\./?$'],
          ],
        },
      ],
    },
  },
  {
    rules: {
      // Type safety rules - more flexible
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/only-throw-error': 'off',

      // Promise and async rules - more flexible
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': 'warn',

      // Variable and function rules - more flexible
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'destructuredArrayIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',

      // Import and module rules - more flexible
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',

      // General rules - more flexible
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-empty': 'warn',
      'prefer-const': 'warn'
    },
  },
);