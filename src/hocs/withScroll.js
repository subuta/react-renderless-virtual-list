import {
  compose,
  lifecycle,
  withStateHandlers,
  withHandlers,
  withPropsOnChange
} from 'recompose'
import _ from 'lodash'

import fastdom from 'src/utils/fastdom'

export const SCROLL_REASON_REQUESTED = 'SCROLL_REASON_REQUESTED'
export const SCROLL_REASON_ON_SCROLL_EVENT = 'SCROLL_REASON_ON_SCROLL_EVENT'

export default compose(
  withStateHandlers(
    () => ({
      scrollTop: 0,
      scrollReason: null
    }),
    {
      _onScroll: (state) => (scrollTop, e) => {
        if (state.scrollTop === scrollTop) return
        return {
          scrollTop,
          scrollReason: SCROLL_REASON_ON_SCROLL_EVENT
        }
      },

      requestScrollTo: (state) => (scrollTop) => {
        if (state.scrollTop === scrollTop) return
        return {
          scrollTop,
          scrollReason: SCROLL_REASON_REQUESTED
        }
      }
    }
  ),
  withHandlers((props) => {
    let listen = _.noop
    let scrollContainerRef = null
    let isTicking = false

    const onScroll = (e) => {
      if (!isTicking) {
        fastdom.measure(() => {
          props._onScroll(scrollContainerRef.scrollTop, e)
          isTicking = false
        })

        isTicking = true
      }
    }

    return {
      setScrollContainerRef: () => (ref) => {
        scrollContainerRef = ref

        window.scrollContainerRef = scrollContainerRef

        if (!scrollContainerRef) return
        listen = () => {
          scrollContainerRef.addEventListener('scroll', onScroll, { passive: true })
          return () => scrollContainerRef.removeEventListener('scroll', onScroll)
        }
      },

      scrollTo: () => (scrollTop) => {
        fastdom.mutate(() => {
          scrollContainerRef.scrollTop = scrollTop
        })
      },

      listen: () => listen
    }
  }),
  lifecycle({
    componentDidUpdate () {
      const { scrollReason, scrollTo, scrollTop } = this.props

      if (scrollReason === SCROLL_REASON_REQUESTED) {
        scrollTo(scrollTop)
      }
    },

    componentDidMount () {
      this.unlisten = this.props.listen()
    },

    componentWillUnmount () {
      this.unlisten && this.unlisten()
    }
  })
)
