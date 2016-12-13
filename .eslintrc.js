module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'script'
  },
  extends: [
    'eslint:recommended'
  ],
  env: {
    'node': true,
    'es6': true
  },
  rules: {
    "no-unused-vars": [ "error", { vars: "all", args: "none" }]
  }
};
