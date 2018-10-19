import {
  compose,
  lifecycle,
  withHandlers,
  withState,
} from 'recompose'
import _ from 'lodash'

import ResizeObserver from 'resize-observer-polyfill'

export default compose(
  withState('size', 'setSize', { height: 0, width: 0 }),
  withHandlers(({ setSize }) => {
    let ref = null
    let unobserve = _.noop

    let sizeCache = { height: 0, width: 0 }

    const ro = new ResizeObserver((entries) => {
      const {contentRect} = _.first(entries)
      const { top, right, bottom, left, height, width } = contentRect
      const paddingBottom = bottom - height
      const paddingRight = right - width
      const clientHeight = top + paddingBottom + height
      const clientWidth = left + paddingRight + width

      sizeCache = {
        height: clientHeight,
        width: clientWidth
      }

      setSize(sizeCache)
    })

    const observe = () => {
      if (!ref) return
      ro.observe(ref)
      return () => {
        ro.unobserve(ref)
        ref = null
      }
    }

    return {
      observe,

      setSizeRef: () => (_ref) => {
        ref = _ref
        unobserve = observe()
      },

      unobserve: () => () => {
        unobserve()
      }
    }
  }),
  lifecycle({
    componentWillUnmount () {
      this.props.unobserve()
    }
  })
)
