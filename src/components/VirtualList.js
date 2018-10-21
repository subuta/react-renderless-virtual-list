import React from 'react'

import _ from 'lodash'

import {
  compose,
  withHandlers,
  withPropsOnChange,
  withState,
  withProps
} from 'recompose'

import mapScrollTop from 'src/hocs/mapScrollTop'
import VirtualListItem from './VirtualListItem'

const defaultRenderListContainer = (props) => {
  const {
    className = 'c-virtual-list-container',
    children,
    style,
    setScrollContainerRef
  } = props

  return (
    <div ref={setScrollContainerRef} className={className} style={style}>{children}</div>
  )
}

const defaultRenderList = (props) => {
  const {
    className = 'c-virtual-list',
    children,
    style
  } = props

  return (
    <div className={className} style={style}>{children}</div>
  )
}

const enhance = compose(
  mapScrollTop,
  withState('heightCache', 'setHeightCache', []),
  // Specify defaults
  withProps((props) => {
    const {
      defaultRowHeight = 100,
      height = 300,
      overScanCount = 3,
      renderList = defaultRenderList,
      renderListContainer = defaultRenderListContainer,
      rows,
      heightCache
    } = props

    // Calculate virtual list height.
    const hasDoneHeightMeasuring = heightCache.length === rows.length
    const estimatedHeight = rows.length * defaultRowHeight
    const totalHeight = hasDoneHeightMeasuring ? _.sum(heightCache) : _.min([_.sum(heightCache), estimatedHeight])

    return {
      totalHeight,
      overScanCount,
      renderList,
      renderListContainer,
      defaultRowHeight,
      // parse `100px` or 100
      height: _.isNumber(height) ? height : parseFloat(height, 10)
    }
  }),
  withHandlers((props) => {
    let debouncedHeightCache = []
    const setHeightCache = _.debounce(props.setHeightCache, 1000 / 30)
    return {
      setDebouncedHeightCache: ({ heightCache }) => (index, height) => {
        debouncedHeightCache[index] = height
        if (!_.isEqual(heightCache, debouncedHeightCache)) {
          setHeightCache(debouncedHeightCache)
        }
      }
    }
  }),
  withHandlers({
    onMeasure: ({ setDebouncedHeightCache }) => (index, size) => {
      setDebouncedHeightCache(index, size.height)
    },

    calculateIndexes: (props) => () => {
      const {
        heightCache,
        rows,
        scrollTop,
        height,
        overScanCount,
        defaultRowHeight
      } = props

      let sum = 0
      let visibleIndex = { from: -1, to: 0 }

      // Top position of rows.
      let startOfRows = 0
      // Bottom position of rows.
      let endOfRows = scrollTop + height

      _.takeWhile(heightCache, (h, i) => {
        visibleIndex.to = i

        if (visibleIndex.from === -1 && sum + h >= scrollTop) {
          visibleIndex.from = i
          // Use current sum as start position of rows.
          startOfRows = sum
        }

        if (sum >= endOfRows) return false

        sum += h

        return true
      })

      // Use temporary value while heightCache is empty.
      if (visibleIndex.to === 0) {
        return {
          overScanIndex: {
            from: 0,
            to: rows.length - 1
          },
          positions: {
            start: 0,
            end: scrollTop + height + (overScanCount * defaultRowHeight)
          }
        }
      }

      const overScanIndex = {
        from: visibleIndex.from - overScanCount >= 0 ? visibleIndex.from - overScanCount : 0,
        to: visibleIndex.to + overScanCount <= rows.length - 1 ? visibleIndex.to + overScanCount : rows.length - 1
      }

      // Minus top overScan height for correct startOfRows.
      startOfRows -= _.sum(_.slice(heightCache, overScanIndex.from, visibleIndex.from))
      endOfRows += _.sum(_.slice(heightCache, visibleIndex.to, overScanIndex.to))

      return {
        visibleIndex,
        overScanIndex,
        positions: {
          start: startOfRows,
          end: endOfRows
        }
      }
    },

    getStyles: ({ totalHeight, height }) => () => {
      if (totalHeight === 0) return {}

      const containerStyle = height ? {
        height,
        width: '100vw',
        overflowX: 'auto',
        willChange: 'transform'
      } : {}

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
  }),
  withHandlers({
    renderListItem: (props) => ({ row, index, startOfRows }) => {
      const {
        // Will be used as height before render row.
        defaultRowHeight,
        onMeasure
      } = props

      return (
        <VirtualListItem
          key={index}
          row={row}
          index={index}
          onMeasure={onMeasure}
          defaultRowHeight={defaultRowHeight}
          // For renderProps.
          render={props.render}
          children={props.children}
          startOfRows={startOfRows}
        />
      )
    }
  }),
  withPropsOnChange(
    ['scrollTop', 'height', 'totalHeight'],
    (props) => ({
      ...props.calculateIndexes(),
      ...props.getStyles()
    })
  ),
  withPropsOnChange(
    ['renderList', 'renderListContainer', 'renderListItem'],
    ({ renderList, renderListContainer, renderListItem }) => ({
      renderList: _.memoize(renderList),
      renderListContainer: _.memoize(renderListContainer),
      renderListItem: _.memoize(renderListItem, (props) => `${props.index}-${props.startOfRows}`),
    })
  )
)

export default enhance((props) => {
  const {
    rows = [],
    containerStyle = {},
    listStyle = {},
    // Will be used as height before render row.
    defaultRowHeight,
    overScanIndex = {
      from: 0,
      to: rows.length - 1
    },
    heightCache,
    renderList,
    setScrollContainerRef,
    renderListItem,
    renderListContainer
  } = props

  let startOfRows = _.get(props, 'positions.start')
  const endOfRows = _.get(props, 'positions.end')

  const List = renderList
  const Container = renderListContainer

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

          const component = renderListItem({ row, index, startOfRows })

          startOfRows += heightCache[index] || defaultRowHeight

          return component
        })}
      </List>
    </Container>
  )
})
