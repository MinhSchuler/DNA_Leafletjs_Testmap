module.exports = {
    transform: {
      '^.+\\.js$': 'babel-jest',  // Ensure JavaScript files are transformed using Babel
      '^.+\\.vue$': '@vue/vue3-jest'  // Ensure Vue files are handled for Vue 3
    },
    moduleFileExtensions: [
      'js',
      'json',
      'vue'
    ],
    testMatch: [
      '**/tests/**/*.spec.js'
    ]
  };