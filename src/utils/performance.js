import _ from 'lodash'

const isBrowser = typeof window !== 'undefined'

// Isomorphic now function :)
const now = () => isBrowser ? window.performance.now() : new Date()

const measure = (mark, fn, skip = true) => {
  // If mark is omitted.
  if (_.isFunction(mark)) {
    skip = fn
    fn = mark
    mark = ''
  }

  if (skip) return fn();

  const t0 = now()

  fn()

  const t1 = now()
  const diff = t1 - t0

  console.log(`${mark ? `[${mark}] ` : ''}Took ${(diff)} milliseconds.`)

  return diff
}

// Allow mocha style `skip` of measure call :)
measure.skip = (mark, fn) => {
  if (_.isFunction(mark)) {
    fn = mark
  }

  return fn()
}

export {
  now,
  measure
}

export default {
  now,
  measure
}
