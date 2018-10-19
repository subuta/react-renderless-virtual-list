import React from 'react'

import _ from 'lodash'

import {
  compose
} from 'recompose'

import mapVh from 'src/hocs/mapVh'

import VirtualListItem from './VirtualListItem'

const enhance = compose(
  mapVh
)

export default enhance((props) => {
  const {
    rows = [],
    renderList,
    vh,
    ...rest
  } = props

  const style = vh ? {
    height: vh,
    overflowX: 'auto',
    overflowY: 'scroll'
  } : {}

  const List = renderList || (({ children }) => {
    return (
      <div
        className="c-virtual-list"
        style={style}
      >
        {children}
      </div>
    )
  })

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
