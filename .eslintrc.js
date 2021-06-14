module.exports = {
  extends: [
    'alloy',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'switch-colon-spacing': ['error', { 'after': true, 'before': false }],
    quotes: ['error', 'single'],
    indent: ['error', 2, { SwitchCase: 1 }],
    'eol-last': ['error', 'always'],
    'space-infix-ops': 'off',
    'max-nested-callbacks': 'off',
    'max-params': 'off',
    'prefer-regex-literals': 'off',
    'no-useless-call': 'off',
    'complexity': 'off',
    'no-new-func': 'off',
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'key-spacing': [2, { 'beforeColon': false, 'afterColon': true, 'mode': 'strict' }],
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
  },
};
