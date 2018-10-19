import {
  compose,
  lifecycle,
  withState,
  withHandlers
} from 'recompose'
import _ from 'lodash'

export default compose(
  withState('vh', 'setVh', 0),
  withHandlers({
    onResize: ({ vh, setVh }) => (nextVh) => {
      if (vh === nextVh) return
      setVh(nextVh)
    }
  }),
  withHandlers(({ setVh, onResize }) => {
    const listener = _.debounce(() => onResize(window.innerHeight), 1000 / 60, { leading: true, trailing: false })
    return {
      listen: () => () => {
        window.addEventListener('resize', listener)

        // Load once.
        listener()

        return () => window.removeEventListener('resize', listener)
      }
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
