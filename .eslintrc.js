module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier', 'react-hooks'],
  rules: {
    'prettier/prettier': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', 'supabase/', 'scraper/', 'android/', 'ios/'],
};
