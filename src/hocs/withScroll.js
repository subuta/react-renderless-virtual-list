import {
  compose,
  lifecycle,
  withStateHandlers,
  withHandlers, withPropsOnChange
} from 'recompose'
import _ from 'lodash'

const SCROLL_REASON_REQUESTED = 'SCROLL_REASON_REQUESTED'
const SCROLL_REASON_ON_SCROLL_EVENT = 'SCROLL_REASON_ON_SCROLL_EVENT'

export default compose(
  withStateHandlers(
    () => ({
      scrollTop: 0,
      scrollReason: SCROLL_REASON_ON_SCROLL_EVENT
    }),
    {
      onScroll: (state) => (scrollTop) => {
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

    const onScroll = (e) => requestAnimationFrame(() => props.onScroll(scrollContainerRef.scrollTop, e))

    return {
      setScrollContainerRef: () => (ref) => {
        scrollContainerRef = ref

        if (!scrollContainerRef) return
        listen = () => {
          scrollContainerRef.addEventListener('scroll', onScroll, { passive: true })

          onScroll(scrollContainerRef.scrollTop)

          return () => scrollContainerRef.removeEventListener('scroll', onScroll)
        }
      },

      scrollTo: () => (scrollTop) => {
        _.delay(() => {
          scrollContainerRef.scrollTop = scrollTop
        }, 0)
      },

      listen: () => listen
    }
  }),
  withPropsOnChange(
    ['scrollReason'],
    (props) => {
      if (props.scrollReason === SCROLL_REASON_REQUESTED) {
        props.scrollTo(props.scrollTop)
      }
    }
  ),
  lifecycle({
    componentDidMount () {
      this.unlisten = this.props.listen()
    },

    componentWillUnmount () {
      this.unlisten && this.unlisten()
    }
  })
)
