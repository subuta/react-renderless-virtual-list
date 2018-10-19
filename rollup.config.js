import _ from 'lodash'

import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'

import pkg from './package.json'

const external = [
  ...Object.keys(pkg.peerDependencies || {})
]

// For suppress warning of rollup :(
const namedExports = {}

let globals = _.transform(pkg.peerDependencies, (result, value, key) => {
  result[key] = _.upperFirst(_.camelCase(key))
}, {})

globals = {
  ...globals
}

const getConfig = (input, output, name) => ({
  input: input,
  external,
  output: [
    {
      name,
      globals,
      file: output,
      format: 'umd'
    }
  ],
  plugins: [
    json(),
    babel({
      babelrc: false,
      presets: [
        '@babel/preset-react',
        [
          '@babel/preset-env',
          {
            'targets': {
              'node': 'current'
            }
          }
        ]
      ],
      plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        'lodash',
        ["module-resolver", {
          "root": ["./"]
        }]
      ]
    }),
    resolve(),
    commonjs({ namedExports })
  ]
})

export default [
  getConfig('src/index.js', 'lib/index.js', 'reactRenderlessVirtualList')
]
