import React from 'react'
import { hot } from 'react-hot-loader'

import _ from 'lodash'
import faker from 'faker'

import {
  SCROLL_DIRECTION_UP,

  VirtualList,
  Sized
} from 'src'

import {
  compose,
  withHandlers,
  withStateHandlers,
  withPropsOnChange
} from 'recompose'

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

// Initial rows count
const ROWS_COUNT = 30

const createFakeRow = (index) => {
  // Fix faker seed for getting same result.
  faker.seed(index)
  const text = faker.lorem.paragraphs()
  return { id: index + 1, text }
}

const enhance = compose(
  hot(module),
  withStateHandlers(
    () => ({
      rows: _.times(ROWS_COUNT, createFakeRow)
    }),
    {
      loadRows: ({ rows }) => () => {
        const nextRows = [...rows, ..._.map(_.range(rows.length, rows.length + ROWS_COUNT), createFakeRow)]
        return { rows: nextRows }
      }
    }
  ),
  withPropsOnChange(
    ['loadRows'],
    ({ loadRows }) => ({ loadRows: _.debounce(loadRows, 1000 / 16, { leading: true, trailing: false }) })
  ),
  withHandlers({
    onScroll: ({ rows, loadRows }) => ({ direction, overScanIndex }) => {
      if (direction === SCROLL_DIRECTION_UP && overScanIndex.to >= rows.length - 1) {
        loadRows()
      }
    }
  })
)

export default enhance(({ rows, onScroll }) => {
  return (
    <div className='flex flex-col h-screen'>
      <header className='p-4 flex-0 border-b-2'>Fixed header area</header>

      <Sized>
        {({ size, setSizeRef }) => {
          return (
            <div
              className='flex-1 overflow-hidden'
              ref={setSizeRef}
            >
              <VirtualList
                onScroll={onScroll}
                height={size.height}
                rows={rows}
                reversed
              >
                {renderList}
              </VirtualList>
            </div>
          )
        }}
      </Sized>
    </div>
  )
})
