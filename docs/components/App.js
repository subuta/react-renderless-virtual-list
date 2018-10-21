import React from 'react'
import { hot } from 'react-hot-loader'

import _ from 'lodash'
import faker from 'faker'

import {
  VirtualList,
  Sized
} from 'src'

const rows = _.times(30, (index) => {
  // Fix faker seed for getting same result.
  faker.seed(index)
  const text = faker.lorem.paragraphs()
  return { text }
})

export default hot(module)(() => {
  return (
    <Sized>
      {({size}) => {
        return (
          <div style={{height: '100vh'}}>
            <VirtualList
              height={size.height}
              rows={rows}
            >
              {({ row, index, style, setSizeRef }) => {
                return (
                  <div style={style} className={`row-${index}`}>
                    <div ref={setSizeRef}>
                      {row.text}
                    </div>
                  </div>
                )
              }}
            </VirtualList>
          </div>
        )
      }}
    </Sized>
  )
})
