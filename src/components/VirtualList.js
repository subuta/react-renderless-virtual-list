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
        defaultRowSize={rowSize}
        reversed={reversed}
        // For renderProps.
        render={props.render}
        children={props.children}
        startOfRows={startOfRows}
      />
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
  // Specify defaults
  defaultProps(defaults),
  // withProps(
  //   ['renderList', 'renderListContainer', 'renderListItem'],
  //   ({ renderList, renderListContainer, renderListItem }) => ({
  //     renderList: _.memoize(renderList),
  //     renderListContainer: _.memoize(renderListContainer),
  //     renderListItem: _.memoize(renderListItem)
  //   })
  // ),
  withProps(({ height }) => {
    return {
      height: _.isNumber(height) ? height : parseFloat(height, 10),
    }
  }),
  pure,
  withStateHandlers(
    ({ reversed, rows }) => {
      const heightCache = _.fill(new Array(rows.length), defaults.rowSize.height)
      return {
        heightCache,
        totalHeight: _.sum(heightCache)
      }
    },
    {
      mergeHeightCache: (state, { rows }) => (heightCache) => {
        const nextHeightCache = _.merge([...state.heightCache], heightCache)
        // console.log('nextHeightCache = ', nextHeightCache)
        if (_.isEqual(state.heightCache, nextHeightCache)) return
        return {
          heightCache: _.merge(_.fill(new Array(rows.length), defaults.rowSize.height), nextHeightCache),
          totalHeight: _.sum(heightCache)
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
  withHandlers({
    onMeasure: ({ setHeightCache }) => (index, size) => {
      setHeightCache(index, size.height)
    },

    calculateIndexes: (props) => () => {
      const {
        scrollTop = 0,
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

      return {
        visibleIndex,
        overScanIndex,
        positions: {
          start: startOfRows,
          end: endOfRows
        }
      }
    },

    getStyles: ({ heightCache, height }) => () => {
      // Calculate virtual list height.
      const totalHeight = _.sum(heightCache)

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
  }),
  withPropsOnChange(
    ['scrollTop', 'height', 'totalHeight'],
    (props) => ({
      ...props.calculateIndexes(),
      ...props.getStyles()
    })
  ),
  lifecycle({
    componentDidMount () {
      if (this.props.reversed) {
        // Should rendered from bottom position if reversed.
        _.delay(() => this.props.requestScrollTo(this.props.totalHeight), 0)
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

          const component = renderListItem({ ...props, row, index, startOfRows })

          startOfRows += heightCache[index]

          return component
        })}
      </List>
    </Container>
  )
})
