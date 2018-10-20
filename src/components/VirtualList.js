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

import VirtualListItem from './VirtualListItem'

const enhance = compose(
  mapVh,
  // Specify defaults
  withProps(({ overScanCount = 3 }) => ({
    overScanCount
  })),
  withState('heightCache', 'setHeightCache', []),
  withState('scrollTop', 'setScrollTop', 0),
  withPropsOnChange(
    ['renderList'],
    (props) => {
      const List = props.renderList || ((props) => {
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
      })
      return { List }
    }
  ),
  withHandlers({
    onScroll: ({ setScrollTop, scrollTop }) => (nextScrollTop) => {
      if (scrollTop === nextScrollTop) return
      setScrollTop(nextScrollTop)
    },
  }),
  withHandlers((props) => {
    let internalHeightCache = []
    let listen = _.noop
    let listRef = null

    const onScroll = (e) => requestAnimationFrame(() => props.onScroll(listRef.scrollTop, e))
    const setHeightCache = _.debounce(props.setHeightCache, 1000 / 60)

    return {
      setInternalHeightCache: ({ heightCache }) => (index, height) => {
        internalHeightCache[index] = height
        if (!_.isEqual(heightCache, internalHeightCache)) {
          setHeightCache(internalHeightCache)
        }
      },

      setListRef: () => (ref) => {
        listRef = ref

        if (!listRef) return
        listen = () => {
          listRef.addEventListener('scroll', onScroll, { passive: true })

          onScroll(listRef.scrollTop)

          return () => listRef.removeEventListener('scroll', onScroll)
        }
      },

      listen: () => listen
    }
  }),
  withHandlers({
    onMeasure: ({ setInternalHeightCache }) => (index, size) => {
      setInternalHeightCache(index, size.height)
    }
  }),
  withPropsOnChange(
    (props, nextProps) => {
      // FIXME: merge withPropsOnChange with later one.
      const isScrollTopChanged = props.scrollTop !== nextProps.scrollTop
      const isHeightChanged = props.height !== nextProps.height
      const isVhChanged = props.vh !== nextProps.vh
      const isHeightCacheChanged = !_.isEqual(props.heightCache, nextProps.heightCache)
      return isScrollTopChanged || isHeightChanged || isVhChanged || isHeightCacheChanged
    },
    (props) => {
      const {
        vh,
        heightCache
      } = props

      const height = (props.height === '100vh' && vh > 0) ? vh : (height || 300)
      const hasHeight = !_.isNaN(Number(height))

      if (!hasHeight || _.isEmpty(heightCache)) return { height }

      const totalHeight = _.sum(heightCache)

      const containerStyle = hasHeight ? {
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
        height,
        containerStyle,
        listStyle
      }
    }
  ),
  withPropsOnChange(
    (props, nextProps) => {
      const isScrollTopChanged = props.scrollTop !== nextProps.scrollTop
      const isHeightChanged = props.height !== nextProps.height
      const isHeightCacheChanged = !_.isEqual(props.heightCache, nextProps.heightCache)
      return isScrollTopChanged || isHeightChanged || isHeightCacheChanged
    },
    ({ heightCache, rows, scrollTop, height, overScanCount }) => {
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

      if (!visibleIndex.to) {
        return {
          overScanIndex: { from: 0, to: rows.length - 1 }
        }
      }

      const overScanIndex = {
        from: visibleIndex.from - overScanCount >= 0 ? visibleIndex.from - overScanCount : 0,
        to: visibleIndex.to + overScanCount <= rows.length - 1 ? visibleIndex.to + overScanCount : rows.length - 1
      }

      // Minus top overScan height for correct startOfRows.
      startOfRows -= _.sum(_.slice(heightCache, overScanIndex.from, visibleIndex.from))
      endOfRows += _.sum(_.slice(heightCache, overScanIndex.to, visibleIndex.to))

      return {
        visibleIndex,
        overScanIndex,
        positions: {
          start: startOfRows,
          end: endOfRows
        }
      }
    }
  ),
  lifecycle({
    componentDidMount () {
      this.unlisten = this.props.listen()
    },

    componentWillUnmount () {
      this.unlisten && this.unlisten()
    }
  })
)

export default enhance((props) => {
  const {
    rows = [],
    containerStyle = {},
    listStyle = {},
    // Will be used as height before render row.
    defaultRowHeight = 100,
    List,
    onMeasure,
    setListRef,
    heightCache,
    overScanIndex,
    scrollTop,
    height
  } = props

  let startOfRows = _.get(props, 'positions.start', 0)
  const endOfRows = _.get(props, 'positions.end', scrollTop + height)

  return (
    <div
      style={containerStyle}
      ref={setListRef}
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
