import {
  compose,
  lifecycle,
  withState,
  withHandlers
} from 'recompose'
import _ from 'lodash'

export default compose(
  withState('scrollTop', 'setScrollTop', 0),
  withHandlers({
    onScroll: ({ setScrollTop, scrollTop }) => (nextScrollTop) => {
      if (scrollTop === nextScrollTop) return
      setScrollTop(nextScrollTop)
    },
  }),
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

      listen: () => listen
    }
  }),
  lifecycle({
    componentDidMount () {
      this.unlisten = this.props.listen()
    },

    componentWillUnmount () {
      this.unlisten && this.unlisten()
    }
  })
)
