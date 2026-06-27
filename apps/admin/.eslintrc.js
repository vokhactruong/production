/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["../../.eslintrc.js", "plugin:react-hooks/recommended"],
  env: {
    browser: true,
    es2022: true,
  },
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  },
};
