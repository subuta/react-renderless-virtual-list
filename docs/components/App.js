import React from 'react'
import { hot } from 'react-hot-loader'

import _ from 'lodash'
import faker from 'faker'

import {
  VirtualList,
  Sized
} from 'src'

import {
  compose,
  withHandlers,
  withStateHandlers,
  withPropsOnChange,
  lifecycle
} from 'recompose'

import Placeholder from './Placeholder'
import AnimatedPlaceholder from './AnimatedPlaceholder'

const renderRow = ({ row, setSizeRef, style }) => {
  return (
    <div
      className={`row-${row.id}`}
      style={style}
    >
      <div
        ref={setSizeRef}
        className='relative bg-white px-4 py-2 border-b z-10'
      >
        <span className='text-red font-bold'>Row: {row.id}</span>

        <p>{row.text}</p>
      </div>
    </div>
  )
}

const renderGroupHeader = ({ row, setSizeRef, style }) => {
  const { groupHeader } = row

  return (
    <div
      className={`header-${groupHeader}`}
      style={style}
    >
      <div
        ref={setSizeRef}
        className='c-sticky pin-t z-50 w-screen'
      >
        <div className="py-2 px-4 bg-red text-white font-bold">{`${groupHeader}`}</div>
      </div>
    </div>
  )
}

const renderPlaceholder = (props) => {
  const {
    className = 'placeholder',
    style
  } = props

  return (
    <Placeholder
      key='placeholder'
      className={className}
      style={style}
    />
  )
}

const renderAnimatedPlaceholder = (props) => {
  const {
    className = 'placeholder',
    style
  } = props

  return (
    <AnimatedPlaceholder
      key='placeholder'
      className={className}
      style={style}
    />
  )
}

// Initial rows count
const ROWS_COUNT = 100

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
      rows: _.times(ROWS_COUNT, createFakeRow),
      scrollToIndex: null
    }),
    {
      loadRows: ({ rows }) => () => {
        const nextRows = [...rows, ..._.map(_.range(rows.length, rows.length + ROWS_COUNT), createFakeRow)]
        return { rows: nextRows }
      },

      prependRow: ({ rows }) => () => {
        const nextRows = [createFakeRow(10000), ...rows]
        return { rows: nextRows, scrollToIndex: 0 }
      },

      setScrollToIndex: () => (scrollToIndex) => ({ scrollToIndex })
    }
  ),
  withPropsOnChange(
    ['loadRows'],
    ({ loadRows }) => ({ loadRows: _.debounce(loadRows, 1000 / 60, { leading: true, trailing: false }) })
  ),
  withHandlers({
    onLoadMore: ({ loadRows }) => () => {
      console.log('Try to load more ....')
      _.delay(() => {
        console.log('3 seconds elapsed!')
        loadRows()
      }, 3000)
    },

    onPrepend: ({ prependRow, setScrollToIndex }) => () => {
      prependRow()
      requestAnimationFrame(() => setScrollToIndex(null))
    }
  })
)

export default enhance((props) => {
  const {
    rows,
    onScroll,
    onLoadMore,
    onPrepend,
    setScrollToIndex,
    scrollToIndex
  } = props

  window.onPrepend = onPrepend

  let draftScrollToIndex = null

  return (
    <div className='flex flex-col h-screen'>
      <header className='p-4 flex-0 border-b-2 flex items-center justify-between'>
        <span>Fixed header area</span>

        <span className='flex items-stretch justify-center'>
          <input
            className="w-16 border px-4 py-2 rounded outline-none"
            type="text"
            placeholder="No"
            onChange={(e) => {
              draftScrollToIndex = e.target.value
            }}
            onKeyDown={(e) => {
              if (_.toLower(e.key) === 'enter') {
                setScrollToIndex(Number(draftScrollToIndex) - 1)
              }
            }}
          />

          <button
            className="ml-2 px-2 rounded border"
            onClick={() => setScrollToIndex(Number(draftScrollToIndex) - 1)}
          >
            Go
          </button>
        </span>
      </header>

      <Sized>
        {({ size, setSizeRef }) => {
          return (
            <div
              className='flex-1 overflow-hidden'
              ref={setSizeRef}
            >
              <VirtualList
                onLoadMore={onLoadMore}
                onScroll={onScroll}
                height={size.height}
                width={size.width}
                rows={rows}
                groupBy={({ row }) => {
                  const header = Math.floor(row.id / 25) * 25
                  if (header === 0) return null

                  return `${header}th`
                }}
                keyBy={({ row }) => row.id}
                renderGroupHeader={renderGroupHeader}
                // renderPlaceholder={renderAnimatedPlaceholder}
                renderPlaceholder={renderPlaceholder}
                scrollToIndex={scrollToIndex}
                reversed
              >
                {renderRow}
              </VirtualList>
            </div>
          )
        }}
      </Sized>
    </div>
  )
})
