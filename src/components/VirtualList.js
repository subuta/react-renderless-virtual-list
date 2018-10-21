import React from 'react'

import _ from 'lodash'

import {
  compose,
  withHandlers,
  withPropsOnChange,
  withState,
  withProps,
  lifecycle
} from 'recompose'

import mapVh from 'src/hocs/mapVh'
import mapScrollTop from 'src/hocs/mapScrollTop'
import VirtualListItem from './VirtualListItem'

const defaultRenderList = (props) => {
  const {
    children,
    style
  } = props

  return (
    <div
      className="c-virtual-list"
      style={style}
    >
      {children}
    </div>
  )
}

const enhance = compose(
  mapVh,
  mapScrollTop,
  withState('heightCache', 'setHeightCache', []),
  // Specify defaults
  withProps((props) => {
    const {
      overScanCount = 3,
      renderList = defaultRenderList,
      height = 300,
      vh = 0
    } = props

    const nextHeight = (height === '100vh' && vh > 0) ? vh : height
    const hasHeight = !_.isNaN(Number(nextHeight))

    return {
      overScanCount,
      List: renderList,
      height: hasHeight ? nextHeight : 300
    }
  }),
  withHandlers((props) => {
    let internalHeightCache = []

    const setHeightCache = _.debounce(props.setHeightCache, 1000 / 60)

    return {
      setInternalHeightCache: ({ heightCache }) => (index, height) => {
        internalHeightCache[index] = height
        if (!_.isEqual(heightCache, internalHeightCache)) {
          setHeightCache(internalHeightCache)
        }
      }
    }
  }),
  withHandlers({
    onMeasure: ({ setInternalHeightCache }) => (index, size) => {
      setInternalHeightCache(index, size.height)
    },

    calculateIndexes: ({ heightCache, rows, scrollTop, height, overScanCount }) => () => {
      let sum = 0
      let visibleIndex = { from: -1 }

      // Top position of rows.
      let startOfRows = 0
      // Bottom position of rows.
      let endOfRows = scrollTop + height

      _.takeWhile(heightCache, (h, i) => {
        if (visibleIndex.from === -1 && sum + h >= scrollTop) {
          visibleIndex.from = i
          // Use current sum as start position of rows.
          startOfRows = sum
        }

        sum += h

        const isEnd = sum >= endOfRows

        if (isEnd) {
          visibleIndex.to = i
        }

        return !isEnd
      })

      if (!visibleIndex.to) return {}

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

    getStyles: ({ height, heightCache }) => () => {
      if (_.isEmpty(heightCache)) return {}

      const totalHeight = _.sum(heightCache)

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
        totalHeight,
        containerStyle,
        listStyle
      }
    }
  }),
  withPropsOnChange(
    (props, nextProps) => {
      const isScrollTopChanged = props.scrollTop !== nextProps.scrollTop
      const isHeightChanged = props.height !== nextProps.height
      const isVhChanged = props.vh !== nextProps.vh
      return isScrollTopChanged || isHeightChanged || isVhChanged || !_.isEqual(props.heightCache, nextProps.heightCache)
    },
    ({ calculateIndexes, getStyles }) => ({
      ...calculateIndexes(),
      ...getStyles()
    })
  )
)

export default enhance((props) => {
  const {
    rows = [],
    containerStyle = {},
    listStyle = {},
    overScanIndex = {
      from: 0,
      to: rows.length - 1
    },
    // Will be used as height before render row.
    defaultRowHeight = 100,
    List,
    onMeasure,
    setScrollContainerRef,
    heightCache,
    scrollTop,
    height
  } = props

  let startOfRows = _.get(props, 'positions.start', 0)
  const endOfRows = _.get(props, 'positions.end', scrollTop + height)

  return (
    <div
      style={containerStyle}
      ref={setScrollContainerRef}
    >
      <List style={listStyle}>
        {_.map(rows, (row, index) => {
          // No-render if index out of range.
          if (index < overScanIndex.from || index > overScanIndex.to) return null
          if (startOfRows > endOfRows) return null

          const component = (
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

          startOfRows += heightCache[index] || defaultRowHeight

          return component
        })}
      </List>
    </div>
  )
})
