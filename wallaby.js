module.exports = (wallaby) => {
  return {
    files: [
      'src/**/*.js',
      'scripts/jest.setup.js',
      '!src/**/__tests__/*.js'
    ],

    tests: ['src/**/__tests__/*.js'],

    env: {
      type: 'node',
      runner: 'node'
    },

    compilers: {
      "**/*.js?(x)": wallaby.compilers.babel()
    },

    testFramework: 'jest'
  }
}
