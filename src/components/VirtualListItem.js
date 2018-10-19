import React from 'react'
import _ from 'lodash'

import {
  compose,
  pure
} from 'recompose'

import renderProps from 'src/utils/renderProps'
import withSize from 'src/hocs/withSize'

const enhance = compose(
  pure,
  withSize
)

export default enhance((props) => {
  const {
    setSizeRef,
    row,
    index,
    size,
    ...rest
  } = props

  const exposed = { row, index }

  const style = size.height && size.width ? {
    height: size.height,
    width: size.width
  } : {}

  return React.cloneElement(renderProps(rest, exposed), {
    ref: setSizeRef,
    style: style
  })
})
