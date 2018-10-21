import React from 'react'

import {
  compose
} from 'recompose'

import withSize from 'src/hocs/withSize'
import renderProps from 'src/utils/renderProps'

const enhance = compose(
  withSize
)

export default enhance(({ render, children, size, setSizeRef }) => {
  const exposed = {
    size
  }
  return React.cloneElement(renderProps({ render, children }, exposed), {
    ref: setSizeRef
  })
})
