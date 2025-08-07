module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  plugins: ['@typescript-eslint', 'import'],
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true
    }],
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports'
    }],
    
    // Import
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc' }
    }],
    'import/no-duplicates': 'error',
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-destructuring': ['error', {
      array: false,
      object: true
    }],
    
    // BRUTAL specific
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['react', 'react-*', 'vue', 'vue-*', 'angular', '@angular/*'],
          message: 'BRUTAL has zero dependencies. Do not import external frameworks.'
        }
      ]
    }]
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist',
    'coverage',
    'node_modules',
    '*.config.js',
    '*.config.ts'
  ]
};