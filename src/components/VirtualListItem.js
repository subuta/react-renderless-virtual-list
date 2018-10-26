import React from 'react'
import _ from 'lodash'

import {
  compose,
  pure,
  withPropsOnChange
} from 'recompose'

import renderProps from 'src/utils/renderProps'
import withSize from 'src/hocs/withSize'

const enhance = compose(
  withSize,
  withPropsOnChange(
    (props, nextProps) => !_.isEqual(props.size, nextProps.size),
    ({ onMeasure = _.noop, index, size = {} }) => {
      if (!size.height || !size.width) return
      onMeasure(index, size)
    }
  ),
  pure
)

export default enhance((props) => {
  const {
    size = {},
    defaultRowSize = {},
    reversed = false,
    setSizeRef,
    row,
    index,
    startOfRows,
    ...rest
  } = props

  const exposed = { row, index, setSizeRef }

  let style = {
    position: 'absolute',
    [reversed ? 'bottom' : 'top']: startOfRows,
    left: 0,
    minHeight: defaultRowSize.height,
    minWidth: defaultRowSize.width
  }

  if (size.height && size.width) {
    style = {
      ...style,
      height: size.height,
      width: size.width
    }
  }

  return React.cloneElement(renderProps(rest, exposed), {
    style
  })
})
