import React from 'react'
import _ from 'lodash'

import {
  compose,
  toRenderProps,
  pure,
  withProps,
  withPropsOnChange,
  shouldUpdate
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
      left: 0
    }

    if (size.height) {
      style = {
        ...style,
        height: size.height
      }
    } else {
      style = {
        ...style,
        minHeight: defaultRowSize.height
      }
    }

    return { row, index, setSizeRef, style }
  }),
  shouldUpdate((props, nextProps) => {
    const isSizeChanged = !_.isEqual(props.size, nextProps.size)
    const isRowChanged = !_.isEqual(props.row, nextProps.row)
    const isStyleChanged = !_.isEqual(props.style, nextProps.style)

    return isRowChanged || isStyleChanged || isSizeChanged
  })
)

export default toRenderProps(enhance)
