import React from 'react'

import {
  compose,
  pure,
  toRenderProps
} from 'recompose'

import withSize from 'src/hocs/withSize'

const enhance = compose(
  pure,
  withSize
)

export default toRenderProps(enhance)
