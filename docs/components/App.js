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
  const renderList = ({ children }) => {
    return (
      <ul>
        {children}
      </ul>
    )
  }

  return (
    <VirtualList
      rows={rows}
      renderList={renderList}
    >
      {({ row, index, ...rest }) => {
        console.log(rest)
        return (
          <li key={index}>{row.text}</li>
        )
      }}
    </VirtualList>
  )
})
