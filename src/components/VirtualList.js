import React from 'react'

import _ from 'lodash'

import {
  compose,
  withStateHandlers,
  withHandlers,
  withPropsOnChange,
  withProps,
  defaultProps,
  lifecycle,
  pure
} from 'recompose'

import withScroll from 'src/hocs/withScroll'

import VirtualListItem from './VirtualListItem'

export const SCROLL_DIRECTION_UP = 'SCROLL_DIRECTION_UP'
export const SCROLL_DIRECTION_DOWN = 'SCROLL_DIRECTION_DOWN'

// Default value of props.
const defaults = {
  renderListContainer: (props) => {
    const {
      className = 'c-virtual-list-container',
      children,
      style,
      setScrollContainerRef
    } = props

    return (
      <div ref={setScrollContainerRef} className={className} style={style}>{children}</div>
    )
  },

  renderList: (props) => {
    const {
      className = 'c-virtual-list',
      children,
      style
    } = props

    return (
      <div className={className} style={style}>{children}</div>
    )
  },

  renderListItem: (props) => {
    const {
      // Will be used as height before render row.
      rowSize,
      size,
      onMeasure,
      reversed,
      row,
      index,
      startOfRows
    } = props

    return (
      <VirtualListItem
        key={index}
        row={row}
        index={index}
        onMeasure={onMeasure}
        size={size}
        defaultRowSize={rowSize}
        reversed={reversed}
        startOfRows={startOfRows}
      >
        {props.children}
      </VirtualListItem>
    )
  },

  overScanCount: 6,

  height: 300,

  rowSize: {
    height: 100,
    width: 100
  }
}

const enhance = compose(
  pure,
  // Specify defaults
  defaultProps(defaults),
  withPropsOnChange(
    ['onLoadMore', 'onScroll'],
    ({ onLoadMore, onScroll }) => ({
      onScroll: _.debounce(onScroll || _.noop, 300, { leading: true, trailing: false }),
      onLoadMore: _.debounce(onLoadMore || _.noop, 300, { leading: true, trailing: false })
    })
  ),
  withPropsOnChange(
    ['renderListItem'],
    ({ renderListItem }) => ({
      renderListItem: _.memoize(renderListItem, ({ index, startOfRows, size }) => `row-${index}-${startOfRows}${size.height ? `-${size.height}` : ''}`)
    })
  ),
  withProps(({ height }) => {
    if (height === 0) return { height: defaults.height }
    return {
      height: _.isNumber(height) ? height : parseFloat(height, 10),
    }
  }),
  withStateHandlers(
    ({ reversed, rows }) => {
      const fill = _.fill(new Array(rows.length), defaults.rowSize.height)
      return {
        heightCache: fill,
        totalHeight: _.sum(fill)
      }
    },
    {
      mergeHeightCache: (state) => (heightCache) => {
        const nextHeightCache = _.merge([...state.heightCache], heightCache)
        if (_.isEqual(state.heightCache, nextHeightCache)) return
        return {
          heightCache: nextHeightCache,
          totalHeight: _.sum(nextHeightCache)
        }
      }
    }
  ),
  withScroll,
  withHandlers((props) => {
    let debouncedHeightCache = []

    const mergeHeightCache = _.debounce((heightCache) => {
      props.mergeHeightCache(heightCache)
      // Clear debouncedHeightCache
      debouncedHeightCache = []
    }, 0)

    return {
      setHeightCache: () => (index, height) => {
        debouncedHeightCache[index] = height
        mergeHeightCache(debouncedHeightCache)
      }
    }
  }),
  withHandlers(() => {
    let lastScrollTop = -1
    let isAdjusted = false
    let sizeCache = []

    return {
      onMeasure: ({ setHeightCache }) => (index, size) => {
        sizeCache[index] = size
        setHeightCache(index, size.height)
      },

      handleScroll: (props) => () => {
        const {
          scrollTop = 0,
          onScroll,
          onLoadMore,
          heightCache,
          rows,
          height,
          overScanCount,
          totalHeight,
          reversed
        } = props

        let sum = 0
        let visibleIndex = { from: -1, to: 0 }

        // Start position of rows.
        let startOfRows = reversed ? (totalHeight - (scrollTop + height)) : 0

        // End position of rows.
        let endOfRows = reversed ? (startOfRows + height) : scrollTop + height

        _.takeWhile(_.times(rows.length), (i) => {
          const h = heightCache[i]
          visibleIndex.to = i

          if (visibleIndex.from === -1 && sum + h >= (reversed ? startOfRows : scrollTop)) {
            visibleIndex.from = i
            // Use current sum as start position of rows.
            startOfRows = sum
          }

          if (sum >= endOfRows) return false

          sum += h

          return true
        })

        const overScanIndex = {
          from: visibleIndex.from - overScanCount >= 0 ? visibleIndex.from - overScanCount : 0,
          to: visibleIndex.to + overScanCount <= rows.length - 1 ? visibleIndex.to + overScanCount : rows.length - 1
        }

        // Minus top overScan height for correct startOfRows.
        startOfRows -= _.sum(_.slice(heightCache, overScanIndex.from, visibleIndex.from))
        endOfRows += _.sum(_.slice(heightCache, visibleIndex.to, overScanIndex.to))

        const direction = lastScrollTop > scrollTop ? SCROLL_DIRECTION_UP : SCROLL_DIRECTION_DOWN

        lastScrollTop = scrollTop

        const hasInitialized = !reversed || isAdjusted
        const isEdge = overScanIndex.to >= rows.length - 1

        // Call onScroll.
        if (onScroll && hasInitialized) {
          onScroll({
            scrollTop,
            direction,
            visibleIndex,
            overScanIndex
          })
        }

        if (onLoadMore && hasInitialized && isEdge) {
          onLoadMore({
            scrollTop,
            direction,
            visibleIndex,
            overScanIndex
          })
        }

        return {
          visibleIndex,
          overScanIndex,
          positions: {
            from: startOfRows,
            to: endOfRows
          }
        }
      },

      getSizeCache: () => () => sizeCache,

      getStyles: ({ totalHeight, heightCache, height }) => () => {
        const containerStyle = {
          height,
          width: '100vw',
          overflowX: 'auto',
          willChange: 'transform'
        }

        const listStyle = {
          position: 'relative',
          minHeight: '100%',
          width: '100%',
          height: totalHeight
        }

        return {
          containerStyle,
          listStyle
        }
      },

      adjustScrollTop: (props) => (lastTotalHeight) => {
        const {
          requestScrollTo,
          requestScrollToBottom,
          totalHeight
        } = props

        if (isAdjusted) {
          requestScrollTo(totalHeight - lastTotalHeight)
        } else {
          requestScrollToBottom()
        }

        isAdjusted = true
      }
    }
  }),
  withPropsOnChange(
    ['scrollTop', 'height', 'totalHeight'],
    (props) => ({
      ...props.handleScroll(),
      ...props.getStyles()
    })
  ),
  withPropsOnChange(
    ['rows'],
    (props) => {
      const {
        rows,
        heightCache,
        mergeHeightCache
      } = props

      const fill = _.fill(new Array(rows.length), defaults.rowSize.height)
      mergeHeightCache(_.merge(fill, heightCache))
    }
  ),
  lifecycle({
    componentDidMount () {
      if (this.props.reversed) {
        this.props.adjustScrollTop()
      }
    },

    getSnapshotBeforeUpdate (prevProps) {
      if (!_.isEqual(prevProps.rows, this.props.rows)) {
        return prevProps.totalHeight
      }
      return null
    },

    componentDidUpdate (prevProps, prevState, totalHeight) {
      if (!this.props.reversed) return
      if (totalHeight !== null) {
        requestAnimationFrame(() => this.props.adjustScrollTop(totalHeight))
      }
    }
  })
)

export default enhance((props) => {
  const {
    rows = [],
    containerStyle = {},
    listStyle = {},
    // Will be used as height before render row.
    overScanIndex = {
      from: 0,
      to: rows.length - 1
    },
    heightCache = [],
    renderList,
    setScrollContainerRef,
    renderListItem,
    renderListContainer,
    getSizeCache
  } = props

  let startOfRows = _.get(props, 'positions.from')
  const endOfRows = _.get(props, 'positions.to')

  const List = renderList
  const Container = renderListContainer
  const sizeCache = getSizeCache()

  return (
    <Container
      style={containerStyle}
      setScrollContainerRef={setScrollContainerRef}
    >
      <List style={listStyle}>
        {_.map(rows, (row, index) => {
          // No-render if index out of range.
          if (index < overScanIndex.from || index > overScanIndex.to) return null
          if (startOfRows > endOfRows) return null

          const size = sizeCache[index] || {}

          const component = renderListItem({
            ...props,
            row,
            index,
            size,
            startOfRows
          })

          startOfRows += heightCache[index]

          return component
        })}
      </List>
    </Container>
  )
})
