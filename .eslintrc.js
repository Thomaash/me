// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  env: {
    browser: true
  },
  extends: [
    'plugin:vue/recommended',
    'standard'
  ],
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    // reported by vue-cli-service lint
    'vue/html-closing-bracket-spacing': 'error',
    'vue/max-attributes-per-line': 'off',
    // [] spacing
    'array-bracket-spacing': ['error', 'never'],
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
}
