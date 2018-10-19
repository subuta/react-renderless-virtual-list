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
    setSizeRef,
    row,
    index,
    size,
    // Will be used as height before render row.
    defaultRowHeight = 100,
    ...rest
  } = props

  const exposed = { row, index, setSizeRef }

  const style = size.height && size.width ? {
    height: size.height,
    width: size.width
  } : { minHeight: defaultRowHeight }

  return React.cloneElement(renderProps(rest, exposed), {
    style: style
  })
})
