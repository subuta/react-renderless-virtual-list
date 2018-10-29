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
  return { id: index + 1, text }
})

const renderList = ({ row, index, setSizeRef, style }) => {
  return (
    <div
      className={`row-${row.id}`}
      style={style}
    >
      <div
        ref={setSizeRef}
        className='relative px-4 py-2 border-b'
      >
        <span className='text-red font-bold'>Row: {row.id}</span>

        <p>{row.text}</p>
      </div>
    </div>
  )
}

const render = ({size, setSizeRef}) => {
  return (
    <div
      className='flex-1 overflow-hidden'
      ref={setSizeRef}
    >
      <VirtualList
        height={size.height}
        rows={rows}
        reversed
      >
        {renderList}
      </VirtualList>
    </div>
  )
}

export default hot(module)(() => {
  return (
    <div className='flex flex-col h-screen'>
      <header className='p-4 flex-0 border-b-2'>Fixed header area</header>

      <Sized>
        {render}
      </Sized>
    </div>
  )
})
