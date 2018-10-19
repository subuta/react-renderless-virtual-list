import {
  compose,
  lifecycle,
  withState,
  withHandlers
} from 'recompose'
import _ from 'lodash'

export default compose(
  withState('vh', 'setVh', 0),
  withHandlers(({ setVh }) => ({
    listen: () => {
      const listener = _.debounce((e) => setVh(window.innerHeight), 300)

      window.addEventListener('resize', listener)

      // Load once.
      listener()

      return () => window.removeEventListener('resize', listener)
    }
  })),
  lifecycle({
    componentDidMount () {
      this.unlisten = this.props.listen()
    },

    componentWillUnmount () {
      this.unlisten && this.unlisten()
    }
  })
)
