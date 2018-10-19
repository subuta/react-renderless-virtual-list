import React from 'react'
import { hot } from 'react-hot-loader'

import _ from 'lodash'
import faker from 'faker'

import {
  VirtualList
} from 'src'

const rows = _.times(10, (index) => {
  // Fix faker seed for getting same result.
  faker.seed(index)
  const text = faker.lorem.paragraphs()
  return { text }
})

export default hot(module)(() => {
  const renderList = ({ children, style, setListRef }) => {
    return (
      <ul
        ref={setListRef}
        style={style}
      >
        {children}
      </ul>
    )
  }

  return (
    <VirtualList
      rows={rows}
      renderList={renderList}
      defaultRowHeight={100}
    >
      {({ row, index, style, setSizeRef }) => {
        return (
          <li
            style={style}
          >
            <div ref={setSizeRef}>
              {row.text}
            </div>
          </li>
        )
      }}
    </VirtualList>
  )
})
