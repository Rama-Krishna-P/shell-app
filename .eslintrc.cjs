module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: { project: './tsconfig.json', sourceType: 'module' },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    env: { es2022: true, node: true, browser: true },
    ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
