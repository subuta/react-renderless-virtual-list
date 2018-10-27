import React from 'react'
import _ from 'lodash'

import {
  compose,
  toRenderProps,
  pure,
  withProps,
  withPropsOnChange
} from 'recompose'

import withSize from 'src/hocs/withSize'

const enhance = compose(
  pure,
  withSize,
  withPropsOnChange(
    (props, nextProps) => !_.isEqual(props.size, nextProps.size),
    ({ onMeasure = _.noop, index, size = {} }) => {
      if (!size.height || !size.width) return
      onMeasure(index, size)
    }
  ),
  withProps((props) => {
    const {
      size = {},
      defaultRowSize = {},
      reversed = false,
      setSizeRef,
      row,
      index,
      startOfRows
    } = props

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

    return { row, index, setSizeRef, style }
  })
)

export default toRenderProps(enhance)
