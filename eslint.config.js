import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import solid from 'eslint-plugin-solid/configs/typescript';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  solid,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // SolidJS 特定规则
      'solid/components-return-once': 'error',
      'solid/no-react-specific-props': 'error',
      'solid/event-handlers': 'warn',
      'solid/imports': 'error',
      'solid/jsx-no-duplicate-props': 'error',
      'solid/jsx-no-undef': 'error',
      'solid/jsx-uses-vars': 'error',
      'solid/no-destructure': 'warn',
      'solid/prefer-for': 'warn',
      'solid/reactivity': 'warn',
      'solid/self-closing-comp': 'warn',
      'solid/style-prop': 'warn',

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // 通用规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src-tauri/**',
      'crates/**',
      '.output/**',
      'src/stores/simulation/index.ts',
      'src/utils/chartDrawing/index.ts',
    ],
  }
);
