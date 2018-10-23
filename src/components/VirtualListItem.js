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
  pure,
  withSize,
  withPropsOnChange(
    (props, nextProps) => !_.isEqual(props.size, nextProps.size),
    ({ onMeasure = _.noop, index, size }) => {
      if (!size.height || !size.width) return
      onMeasure(index, size)
    }
  )
)

export default enhance((props) => {
  const {
    defaultRowHeight,
    setSizeRef,
    row,
    index,
    size,
    startOfRows,
    reversed = false,
    ...rest
  } = props

  const style = size.height && size.width ? {
    position: 'absolute',
    [reversed ? 'bottom' : 'top']: startOfRows,
    left: 0,
    height: size.height,
    width: size.width
  } : { minHeight: defaultRowHeight }

  const exposed = { row, index, setSizeRef }

  return React.cloneElement(renderProps(rest, exposed), {
    style: style
  })
})
