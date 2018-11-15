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
  shouldUpdate,
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
      groupHeader,
      isGroupHeader,
      startOfRows,
      top,
      bottom
    } = props

    return (
      <VirtualListItem
        key={index}
        row={row}
        index={index}
        groupHeader={groupHeader}
        onMeasure={onMeasure}
        size={size}
        defaultRowSize={rowSize}
        reversed={reversed}
        startOfRows={startOfRows}
        isGroupHeader={isGroupHeader}
        top={top}
        bottom={bottom}
      >
        {isGroupHeader ? props.renderGroupHeader : props.children}
      </VirtualListItem>
    )
  },

  overScanCount: 4,

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
    ['rows'],
    ({ rows, groupBy }) => {
      let groupIndices = []
      let nextRows = []
      let lastGroupHeader = undefined

      _.each(rows, (row, index) => {
        let nextGroupHeader = null
        if (groupBy) {
          nextGroupHeader = groupBy({ row, index })
        }

        if (lastGroupHeader !== undefined && nextGroupHeader !== lastGroupHeader) {
          nextRows.push({ groupHeader: nextGroupHeader })
          // Keep current indices.
          groupIndices.push(nextRows.length - 1)
        }

        nextRows.push(row)
        lastGroupHeader = nextGroupHeader
      })

      return {
        groupIndices,
        rows: nextRows
      }
    }
  ),
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

      getIsAdjusted: () => () => isAdjusted,

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

      adjustScrollTop: (props) => (scrollTop) => {
        const {
          requestScrollTo,
          requestScrollToBottom,
          hasScrolledToBottom
        } = props

        if (isAdjusted) {
          requestScrollTo(scrollTop)
        } else {
          requestScrollToBottom()
          requestAnimationFrame(() => {
            isAdjusted = hasScrolledToBottom()
          })
        }
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
        return prevProps.scrollTop
      }

      if (prevProps.totalHeight !== this.props.totalHeight) {
        const diff = this.props.totalHeight - prevProps.totalHeight
        return this.props.scrollTop + diff
      }

      return null
    },

    componentDidUpdate (prevProps, prevState, scrollTop) {
      if (!this.props.reversed) return

      if (scrollTop !== null) {
        this.props.adjustScrollTop(scrollTop)
      }
    }
  }),
  shouldUpdate((props, nextProps) => {
    const isOverScanIndexChanged = !_.isEqual(props.overScanIndex, nextProps.overScanIndex)
    const isHeightChanged = !_.isEqual(props.height, nextProps.height)
    const isTotalHeightChanged = !_.isEqual(props.totalHeight, nextProps.totalHeight)

    return isOverScanIndexChanged || isHeightChanged || isTotalHeightChanged
  })
)

export default enhance((props) => {
  const {
    rows = [],
    containerStyle = {},
    listStyle = {},
    groupIndices,
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
    getSizeCache,
    totalHeight,
    reversed
  } = props

  let startOfRows = _.get(props, 'positions.from')
  let oppositeEdge = 0
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
          const isGroupHeader = _.includes(groupIndices, index)

          if (!isGroupHeader) {
            // No-render if index out of range.
            if (index < overScanIndex.from || index > overScanIndex.to) return null
            if (startOfRows > endOfRows) return null
          }

          const size = sizeCache[index] || {}

          let itemProps = {
            ...props,
            row,
            index,
            size,
            startOfRows,
            [reversed ? 'bottom' : 'top']: startOfRows,
            isGroupHeader
          }

          startOfRows += heightCache[index]

          if (isGroupHeader) {
            const oppositeEdgeAttr = reversed ? 'top' : 'bottom'

            itemProps = {
              ...itemProps,
              [oppositeEdgeAttr]: totalHeight - itemProps[reversed ? 'bottom' : 'top'] + 8,
              [reversed ? 'bottom' : 'top']: oppositeEdge
            }

            console.log('itemProps = ', itemProps)

            oppositeEdge = startOfRows
          }

          return renderListItem(itemProps)
        })}
      </List>
    </Container>
  )
})
