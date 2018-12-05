import React from 'react'
import {
  compose,
  lifecycle,
  withStateHandlers
} from 'recompose'

const enhance = compose(
  withStateHandlers(
    () => ({ dots: '' }),
    {
      animateDots: ({ dots }) => () => {
        if (dots.length >= 3) {
          return { dots: '' }
        }
        return { dots: dots + '.' }
      }
    }
  ),
  lifecycle({
    componentDidMount () {
      this.timer = setInterval(() => this.props.animateDots(), 1000)
    },

    componentWillUnmount () {
      clearInterval(this.timer)
    }
  })
)

export default enhance(({ style, dots }) => {
  return (
    <div
      key='placeholder'
      className='placeholder c-sticky h-screen pin flex items-center justify-center z-minus'
      style={style}
    >
      <h3>Loading{dots}</h3>
    </div>
  )
})
