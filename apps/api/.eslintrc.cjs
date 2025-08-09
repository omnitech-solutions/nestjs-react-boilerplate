module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: ['./tsconfig.json'] },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    'import/order': ['error', { 'alphabetize': { order: 'asc', caseInsensitive: true } }]
  }
};
