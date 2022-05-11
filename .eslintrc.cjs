const configureBase = require('@luma-dev/eslint-config-base/configure');

const config = { __dirname };

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@luma-dev/base', '@luma-dev/react'],
  overrides: [
    ...configureBase(config),
    {
      files: '*.tsx',
      rules: {
        'jsx-a11y/media-has-caption': 'off',
        'react/react-in-jsx-scope': 'off',
      },
    },
  ],
};
