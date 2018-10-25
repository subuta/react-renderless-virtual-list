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
  withHandlers({
    onResize: ({ size, setSize }) => (el, entries) => {
      const {contentRect} = _.first(entries)
      const { top, right, bottom, left, height, width } = contentRect
      const paddingBottom = bottom - height
      const paddingRight = right - width
      const clientHeight = top + paddingBottom + height
      const clientWidth = left + paddingRight + width

      const nextSize = {
        height: clientHeight,
        width: clientWidth
      }

      if (clientHeight <= 0 || clientWidth <= 0) return
      if (_.isEqual(size, nextSize)) return

      setSize(nextSize)
    }
  }),
  withHandlers(({ setSize, onResize }) => {
    let sizeRef = null
    let unobserve = _.noop

    const ro = new ResizeObserver((entries) => onResize(sizeRef, entries))

    const observe = () => {
      if (!sizeRef) return
      ro.observe(sizeRef)
      return () => {
        ro.unobserve(sizeRef)
        sizeRef = null
      }
    }

    return {
      observe,

      setSizeRef: () => (_ref) => {
        sizeRef = _ref
        if (!sizeRef) return

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
