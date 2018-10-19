import React from 'react'

import _ from 'lodash'

import {
  compose,
  withHandlers,
  withPropsOnChange,
  lifecycle
} from 'recompose'

import mapVh from 'src/hocs/mapVh'

import VirtualListItem from './VirtualListItem'

const enhance = compose(
  mapVh,
  withHandlers({
    onScroll: () => (e, listRef) => {
      console.log('scroll!', listRef.scrollTop)
    }
  }),
  withHandlers((props) => {
    let heightCache = []
    let listen = _.noop
    let listRef = null

    const onScroll = (e) => requestAnimationFrame(() => props.onScroll(e, listRef))

    return {
      setHeightCache: () => (index, height) => {
        heightCache[index] = height
        console.log(heightCache)
      },

      setListRef: () => (ref) => {
        listRef = ref

        if (!listRef) return
        listen = () => {
          listRef.addEventListener('scroll', onScroll, { passive: true })
          return () => listRef.removeEventListener('scroll', onScroll)
        }
      },

      listen: () => listen,

      getListRef: () => () => listRef
    }
  }),
  withHandlers({
    onMeasure: ({ setHeightCache }) => (index, size) => {
      setHeightCache(index, size.height)
    }
  }),
  withPropsOnChange(
    ['renderList'],
    (props) => {
      const renderList = props.renderList || ((props) => {
        const {
          children,
          style,
          setListRef
        } = props

        return (
          <div
            className="c-virtual-list"
            style={style}
            ref={setListRef}
          >
            {children}
          </div>
        )
      })
      return { renderList }
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
    vh,
    renderList,
    onMeasure,
    setListRef,
    ...rest
  } = props

  const style = vh ? {
    height: vh,
    overflowX: 'auto',
    overflowY: 'scroll',
    willChange: 'height, transform'
  } : {}

  const List = renderList

  return (
    <List
      setListRef={setListRef}
      style={style}
    >
      {_.map(rows, (row, index) => (
        <VirtualListItem
          key={index}
          row={row}
          index={index}
          onMeasure={onMeasure}
          {...rest}
        />
      ))}
    </List>
  )
})
