module.exports = {
  env: {
    node: true,
  },
  extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'simple-import-sort', 'prettier'],
  rules: {
    // plugin rules
    'import/extensions': ['error', 'ignorePackages', { ts: 'never' }],
    'import/prefer-default-export': 'off',
    'simple-import-sort/imports': 'error',
    'prettier/prettier': 'error',

    // basic rules
    'class-methods-use-this': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'no-restricted-syntax': 'off',
    'no-continue': 'off',
    'prefer-destructuring': 'off',

    // typescript conflicting rules
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
  },
  settings: {
    'import/resolver': {
      // this loads <rootdir>/tsconfig.json to eslint
      typescript: {},
    },
  },
};
