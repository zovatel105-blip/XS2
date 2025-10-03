module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    // Prevent duplicate variable declarations in the same scope
    'no-redeclare': 'error',
    
    // Warn about variable shadowing
    'no-shadow': 'warn',
    
    // Prevent unused variables
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // React specific rules
    'react/prop-types': 'off', // We're not using PropTypes
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    
    // Other helpful rules for code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
  ],
};