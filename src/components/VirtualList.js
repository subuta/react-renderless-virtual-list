import React from 'react'

import _ from 'lodash'

import VirtualListItem from './VirtualListItem'

export default (props) => {
  const {
    rows = [],
    renderList,
    ...rest
  } = props

  const List = renderList || (({ children }) => {
    return (
      <div className="c-virtual-list">
        {children}
      </div>
    )
  })

  return (
    <List>
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
}
