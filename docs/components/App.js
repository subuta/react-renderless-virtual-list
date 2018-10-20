import React from 'react'
import { hot } from 'react-hot-loader'

import _ from 'lodash'
import faker from 'faker'

import {
  VirtualList
} from 'src'

const rows = _.times(30, (index) => {
  // Fix faker seed for getting same result.
  faker.seed(index)
  const text = faker.lorem.paragraphs()
  return { text }
})

export default hot(module)(() => {
  const renderList = ({ children, style }) => {
    return (
      <ul style={style}>
        {children}
      </ul>
    )
  }

  return (
    <VirtualList
      height='100vh'
      rows={rows}
      renderList={renderList}
      defaultRowHeight={100}
    >
      {({ row, index, style, setSizeRef }) => {
        return (
          <li style={style} className={`row-${index}`}>
            <div ref={setSizeRef}>
              {row.text}
            </div>
          </li>
        )
      }}
    </VirtualList>
  )
})
