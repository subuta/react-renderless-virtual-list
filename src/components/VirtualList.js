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
import performance from 'src/utils/performance'
import VirtualListState from 'src/utils/virtualListState'

import VirtualListItem from './VirtualListItem'

export const SCROLL_DIRECTION_UP = 'SCROLL_DIRECTION_UP'
export const SCROLL_DIRECTION_DOWN = 'SCROLL_DIRECTION_DOWN'

export const NAMESPACE = '__RRVL__'
const VIRTUAL_LIST_HEIGHT = 10000000

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
      rows,
      row,
      index,
      groupHeader,
      isGroupHeader,
      fromOfRows,
      groupHeight,
      top,
      bottom
    } = props

    return (
      <VirtualListItem
        key={index}
        rows={rows}
        row={row}
        index={index}
        groupHeader={groupHeader}
        onMeasure={onMeasure}
        size={size}
        defaultRowSize={rowSize}
        reversed={reversed}
        fromOfRows={fromOfRows}
        isGroupHeader={isGroupHeader}
        top={top}
        bottom={bottom}
        groupHeight={groupHeight}
      >
        {isGroupHeader ? props.renderGroupHeader : props.children}
      </VirtualListItem>
    )
  },

  overScanCount: 3,

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
      let lastGroupHeader = null

      let lastRow = null

      _.each(rows, (row, index) => {
        let nextGroupHeader = null
        if (groupBy) {
          nextGroupHeader = groupBy({ rows, row, index, lastGroupHeader })
        }

        // Set index
        const lastRowIndex = _.get(lastRow, [NAMESPACE, 'index'], -1)
        _.set(row, [NAMESPACE, 'index'], lastRowIndex + 1)

        // Set index to previousRow.
        const previousRow = rows[index - 1]
        if (previousRow) {
          const previousIndex = _.get(previousRow, [NAMESPACE, 'index'])

          _.set(previousRow, [NAMESPACE, 'nextIndex'], lastRowIndex + 1)
          _.set(row, [NAMESPACE, 'previousIndex'], previousIndex)
        }

        nextRows.push(row)

        if (nextGroupHeader !== lastGroupHeader) {
          // Keep current indices.
          groupIndices.push(nextRows.length)
          nextRows.push({ groupHeader: nextGroupHeader, [NAMESPACE]: { index: lastRowIndex + 2 } })
        }

        lastRow = _.last(nextRows)

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
  withProps(({ height }) => {
    if (height === 0) return { height: defaults.height }

    return {
      height: _.isNumber(height) ? height : parseFloat(height, 10),
    }
  }),
  withStateHandlers(
    ({ reversed, rows, groupIndices }) => {
      const fill = _.fill(new Array(rows.length), defaults.rowSize.height)
      const virtualListState = new VirtualListState(fill, groupIndices)
      return {
        virtualListState,
        heightCache: fill,
        totalHeight: virtualListState.getTotalHeight()
      }
    },
    {
      mergeHeightCache: (state, { groupIndices }) => (heightCache) => {
        const nextHeightCache = _.merge([...state.heightCache], heightCache)
        if (_.isEqual(state.heightCache, nextHeightCache)) return

        const virtualListState = new VirtualListState(nextHeightCache, groupIndices)
        return {
          virtualListState,
          heightCache: nextHeightCache,
          totalHeight: virtualListState.getTotalHeight()
        }
      }
    }
  ),
  withScroll,
  withHandlers((props) => {
    let debouncedHeightCache = []
    let isTicking = false

    return {
      setHeightCache: () => (index, height) => {
        debouncedHeightCache[index] = height

        if (!isTicking) {
          requestAnimationFrame(() => {
            props.mergeHeightCache(debouncedHeightCache)
            isTicking = false
            // Clear debouncedHeightCache
            debouncedHeightCache = []
          })
        }

        isTicking = true
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
          rows,
          height,
          overScanCount,
          virtualListState,
          reversed
        } = props

        // Start position of rows.
        let fromOfRows = reversed ? (VIRTUAL_LIST_HEIGHT - (scrollTop + height)) : scrollTop
        if (reversed && !isAdjusted) {
          fromOfRows = 0
        }

        // End position of rows.
        const endOfRows = fromOfRows + height

        const visibleIndex = virtualListState.findVisibleIndex(fromOfRows, endOfRows)
        const overScanIndex = virtualListState.findOverScanIndex(fromOfRows, endOfRows, overScanCount)

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
            from: overScanIndex.fromPosition,
            to: overScanIndex.toPosition
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
          height: VIRTUAL_LIST_HEIGHT
        }

        return {
          containerStyle,
          listStyle
        }
      },

      adjustScrollTop: ({ requestScrollTo, height }) => (totalHeight = 0) => {
        requestScrollTo((VIRTUAL_LIST_HEIGHT - height) - totalHeight)
        isAdjusted = true
      },

      scrollToRow: (props) => (scrollToIndex) => {
        const {
          rows,
          requestScrollTo,
          height,
          virtualListState
        } = props

        const rowIndex = _.findIndex(rows, (row) => row.index === Number(scrollToIndex))
        const fromOfRows = virtualListState.getFromPosition(rowIndex)

        // Ignore unknown index.
        if (_.isNaN(fromOfRows)) return

        requestScrollTo((VIRTUAL_LIST_HEIGHT - height) - fromOfRows)
      }
    }
  }),
  withHandlers({
    ensureScrollToRow: ({ scrollToRow }) => (scrollToIndex) => {
      scrollToRow(scrollToIndex)
      // FIXME: More smart way to handle scroll gap(of new index).
      _.delay(() => {
        scrollToRow(scrollToIndex)
      }, 300)
    }
  }),
  withPropsOnChange(
    ['scrollTop', 'height'],
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
        return this.props.totalHeight
      }
      return null
    },

    componentDidUpdate (prevProps, prevState, totalHeight) {
      const {
        reversed,
        scrollToIndex,
        adjustScrollTop,
        ensureScrollToRow
      } = this.props

      if (!reversed) return

      if (totalHeight !== null) {
        adjustScrollTop(totalHeight)
      }

      if (prevProps.scrollToIndex !== scrollToIndex) {
        ensureScrollToRow(scrollToIndex)
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
    renderList,
    setScrollContainerRef,
    renderListItem,
    renderListContainer,
    getSizeCache,
    reversed,
    virtualListState
  } = props

  const List = renderList
  const Container = renderListContainer
  const sizeCache = getSizeCache()
  const nearestGroupIndices = virtualListState.nearestGroupIndices(
    overScanIndex.fromPosition,
    overScanIndex.toPosition
  )

  let rendered = []

  const hasNoGroupIndices = _.isEmpty(nearestGroupIndices.all)
  const range = hasNoGroupIndices ? _.range(overScanIndex.from, overScanIndex.to + 1) : _.range(nearestGroupIndices.first || 0, nearestGroupIndices.last + 1)

  performance.measure.skip('renderRows', () => {
    rendered = _.map(range, (index) => {

      const row = rows[index]
      const fromOfRows = virtualListState.getFromPosition(index)
      const size = sizeCache[index] || { height: 0 }

      if (_.includes(groupIndices, index)) {
        // Skip extra group headers.
        if (!_.includes(nearestGroupIndices.all, index)) return null

        const groupHeight = virtualListState.getGroupHeight(index)

        return renderListItem({
          ...props,
          row,
          index,
          size,
          fromOfRows,
          [reversed ? 'bottom' : 'top']: groupHeight.from,
          groupHeight: groupHeight.height,
          isGroupHeader: true
        })
      }

      // No-render if index out of range.
      if (index < overScanIndex.from || index > overScanIndex.to) return null

      return renderListItem({
        ...props,
        row,
        index,
        size,
        fromOfRows,
        [reversed ? 'bottom' : 'top']: fromOfRows
      })
    })
  }, process.env.NODE_ENV === 'production')

  return (
    <Container
      style={containerStyle}
      setScrollContainerRef={setScrollContainerRef}
    >
      <List style={listStyle}>
        {rendered}
      </List>
    </Container>
  )
})
