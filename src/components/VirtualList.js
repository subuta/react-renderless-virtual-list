import React from 'react'

import _ from 'lodash'

import {
  compose,
  withPropsOnChange
} from 'recompose'

import mapVh from 'src/hocs/mapVh'

import VirtualListItem from './VirtualListItem'

const enhance = compose(
  mapVh,
  withPropsOnChange(
    ['renderList'],
    (props) => {
      const renderList = props.renderList || (({ children, style }) => {
        return (
          <div
            className="c-virtual-list"
            style={style}
          >
            {children}
          </div>
        )
      })
      return { renderList }
    }
  )
)

export default enhance((props) => {
  const {
    rows = [],
    vh,
    renderList,
    ...rest
  } = props

  const style = vh ? {
    height: vh,
    overflowX: 'auto',
    overflowY: 'scroll'
  } : {}

  const List = renderList

  return (
    <List
      style={style}
    >
      {_.map(rows, (row, index) => (
        <VirtualListItem
          key={index}
          row={row}
          index={index}
          {...rest}
        />
      ))}
    </List>
  )
})
