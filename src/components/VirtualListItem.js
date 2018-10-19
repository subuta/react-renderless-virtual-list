import React from 'react'

import {
  compose
} from 'recompose'

import renderProps from 'src/utils/renderProps'
import withSize from 'src/hocs/withSize'

const enhance = compose(
  withSize
)

export default enhance((props) => {
  return renderProps(props, props)
})
