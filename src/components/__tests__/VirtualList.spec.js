import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { create } from 'react-test-renderer'

import _ from 'lodash'

import VirtualList from 'src/components/VirtualList'

let clock

import ResizeObserver from 'resize-observer-polyfill'

const mockedObserve = jest.fn()
const mockedUnobserve = jest.fn()

const mockedRequestScrollTo = jest.fn()
const mockedRequestScrollToBottom = jest.fn()

// Mock withScroll while testing.
jest.mock('src/hocs/withScroll', () => {
  return jest.fn().mockImplementation((Component) => {
    return (props) => (
      <Component
        {...props}
        requestScrollTo={mockedRequestScrollTo}
        requestScrollToBottom={mockedRequestScrollToBottom}
      />
    )
  })
})

// Mock for simulate ResizeObserver at jest(with jsdom) environment.
jest.mock('resize-observer-polyfill', () => {
  return jest.fn().mockImplementation(() => {
    return {
      observe: mockedObserve,
      unobserve: mockedUnobserve
    }
  })
})

beforeEach(() => {
  clock = sinon.useFakeTimers()
  mockedRequestScrollTo.mockClear()
  mockedRequestScrollToBottom.mockClear()
  ResizeObserver.mockClear()
  mockedObserve.mockClear()
  mockedUnobserve.mockClear()
})

afterEach(() => {
  clock.restore()
})

test('should not render with empty rows.', () => {
  const child = sinon.spy(() => <span>hoge</span>)

  mount(
    <VirtualList
      rows={[]}
    >
      {child}
    </VirtualList>
  )

  // Should not render anything for empty rows.
  expect(child.callCount).toBe(0)
})

test('should render with 1 rows.', () => {
  const child = sinon.spy(({ row, index, style }) => {
    return (
      <span className={`row-${index + 1}`} style={style}>{row.id}</span>
    )
  })

  const rows = _.times(1, (n) => ({ id: n + 1 }))

  const tree = create(
    <VirtualList
      rows={rows}
    >
      {child}
    </VirtualList>
  )

  expect(child.callCount).toBe(1)

  const props = child.firstCall.args[0]

  expect(props.row).toEqual({ id: 1 })
  expect(props.index).toEqual(0)
  expect(props.setSizeRef).toBeInstanceOf(Function)

  // Testing for snapshot.
  expect(tree.toJSON()).toMatchSnapshot()
})

test('should render with height as px', () => {
  const child = sinon.spy(({ row, index, style }) => {
    return (
      <span className={`row-${index + 1}`} style={style}>{row.id}</span>
    )
  })

  const rows = _.times(1, (n) => ({ id: n + 1 }))

  const tree = create(
    <VirtualList
      height="400px"
      rows={rows}
    >
      {child}
    </VirtualList>
  )

  expect(child.callCount).toBe(1)

  const props = child.firstCall.args[0]

  expect(props.row).toEqual({ id: 1 })
  expect(props.index).toEqual(0)
  expect(props.setSizeRef).toBeInstanceOf(Function)

  // Testing for snapshot.
  expect(tree.toJSON()).toMatchSnapshot()
})

test('should re-render at onMeasure call at VirtualListItem', () => {
  const child = sinon.spy(({ row, index, style }) => (
    <span className={`row-${index + 1}`} style={style}>{row.id}</span>
  ))

  const rows = _.times(1, (n) => ({ id: n + 1 }))

  let simulateResize = _.noop

  ResizeObserver.mockImplementationOnce(cb => {
    simulateResize = cb
    // Delay execution for retrieve ref.
    requestAnimationFrame(() => cb([
      {
        contentRect: {
          top: 0,
          right: 200,
          bottom: 200,
          left: 0,
          height: 100,
          width: 100
        }
      }
    ]))
    return {
      observe: mockedObserve,
      unobserve: mockedUnobserve
    }
  })

  mount(
    <VirtualList
      rows={rows}
    >
      {child}
    </VirtualList>
  )

  expect(child.callCount).toBe(1)

  let props = child.firstCall.args[0]

  expect(props.style).toEqual({
    position: 'absolute',
    top: 0,
    left: 0,
    minHeight: 100
  })

  // At first resize.
  clock.runAll()

  // FIXME: Reduce extra call(may be memoize by size.height + index + startOfRows)
  expect(child.callCount).toBe(3)

  props = child.secondCall.args[0]

  expect(props.style).toEqual({
    position: 'absolute',
    top: 0,
    left: 0,
    height: 200
  })

  // simulate resize event of element.
  simulateResize([
    {
      contentRect: {
        top: 0,
        right: 300,
        bottom: 300,
        left: 0,
        height: 100,
        width: 100
      }
    }
  ])

  clock.runAll()

  expect(child.callCount).toBe(5)

  props = child.getCall(2).args[0]

  expect(props.style).toEqual({
    position: 'absolute',
    top: 0,
    left: 0,
    height: 200
  })
})

test('should render child as pure.', () => {
  const renderListContainer = sinon.spy(({ children }) => <div>{children}</div>)
  const renderList = sinon.spy(({ children }) => <div>{children}</div>)

  const child = sinon.spy(({ row, index, style }) => {
    return (
      <span className={`row-${index + 1}`} style={style}>{row.id}</span>
    )
  })

  const rows = _.times(1, (n) => ({ id: n + 1 }))
  const initialProps = {
    rows,
    renderListContainer,
    renderList
  }

  const wrapper = mount(
    <VirtualList
      {...initialProps}
    >
      {child}
    </VirtualList>
  )

  expect(renderListContainer.callCount).toBe(1)
  expect(renderList.callCount).toBe(1)
  expect(child.callCount).toBe(1)

  const props = child.firstCall.args[0]

  expect(props.row).toEqual({ id: 1 })
  expect(props.index).toEqual(0)
  expect(props.setSizeRef).toBeInstanceOf(Function)

  // Should not re-render if props not changed.
  wrapper.setProps(initialProps)

  expect(renderListContainer.callCount).toBe(1)
  expect(renderList.callCount).toBe(1)
  expect(child.callCount).toBe(1)

  // TODO: should memoize render child.
  // Should not re-render if scrollTop changed.
  wrapper.setProps({
    ...initialProps,
    scrollTop: 100
  })

  expect(renderListContainer.callCount).toBe(1)
  expect(renderList.callCount).toBe(1)
  expect(child.callCount).toBe(1)
})

test('should render with 30 rows.', () => {
  const renderListContainer = sinon.spy(({ children, style }) => <div style={style}>{children}</div>)
  const renderList = sinon.spy(({ children, style }) => <div style={style}>{children}</div>)

  const child = sinon.spy(({ row, index, style }) => {
    return (
      <span className={`row-${index + 1}`} style={style}>{row.id}</span>
    )
  })

  const count = 30
  const rows = _.times(count, (n) => ({ id: n + 1 }))
  const defaultRowHeight = 100
  const totalHeight = defaultRowHeight * count

  const tree = create(
    <VirtualList
      renderListContainer={renderListContainer}
      renderList={renderList}
      rows={rows}
      defaultRowHeight={defaultRowHeight}
    >
      {child}
    </VirtualList>
  )

  expect(renderListContainer.callCount).toBe(1)

  const listContainerProps = renderListContainer.firstCall.args[0]
  expect(listContainerProps.style).toEqual({
    height: 300,
    width: '100vw',
    overflowX: 'auto',
    willChange: 'transform'
  })

  // Should render list.
  expect(renderList.callCount).toBe(1)

  const listProps = renderList.firstCall.args[0]
  expect(listProps.style).toEqual({
    position: 'relative',
    minHeight: '100%',
    width: '100%',
    height: totalHeight
  })

  // Should render only-visible child rows.
  expect(child.callCount).toBe(8)

  clock.runAll()

  // Should not-render after setDebouncedHeightCache.
  expect(child.callCount).toBe(8)

  const childProps = child.firstCall.args[0]

  expect(childProps.row).toEqual({ id: 1 })
  expect(childProps.index).toEqual(0)
  expect(childProps.setSizeRef).toBeInstanceOf(Function)
  expect(childProps.style).toEqual({
    position: 'absolute',
    top: 0,
    left: 0,
    minHeight: 100
  })

  const lastCallChildProps = child.lastCall.args[0]

  expect(lastCallChildProps.row).toEqual({ id: 8 })
  expect(lastCallChildProps.index).toEqual(7)
  expect(lastCallChildProps.setSizeRef).toBeInstanceOf(Function)
  expect(lastCallChildProps.style).toEqual({
    position: 'absolute',
    top: 700,
    left: 0,
    minHeight: 100
  })

  // requestScrollTo should called at componentDidMount
  expect(mockedRequestScrollTo).not.toHaveBeenCalled()

  // Testing for snapshot.
  expect(tree.toJSON()).toMatchSnapshot()
})

test('should render with reversed 30 rows.', () => {
  const renderListContainer = sinon.spy(({ children }) => <div>{children}</div>)
  const renderList = sinon.spy(({ children }) => <div>{children}</div>)

  const child = sinon.spy(({ row, index, style }) => {
    return (
      <span className={`row-${index + 1}`} style={style}>{row.id}</span>
    )
  })

  const count = 30
  const rows = _.times(count, (n) => ({ id: n + 1 }))
  const defaultRowHeight = 100
  const totalHeight = defaultRowHeight * count

  const tree = create(
    <VirtualList
      renderListContainer={renderListContainer}
      renderList={renderList}
      rows={rows}
      defaultRowHeight={defaultRowHeight}
      reversed
    >
      {child}
    </VirtualList>
  )

  expect(mockedRequestScrollToBottom).toHaveBeenCalled();

  expect(renderListContainer.callCount).toBe(1)

  const listContainerProps = renderListContainer.firstCall.args[0]
  expect(listContainerProps.style).toEqual({
    height: 300,
    width: '100vw',
    overflowX: 'auto',
    willChange: 'transform'
  })

  // Should render list.
  expect(renderList.callCount).toBe(1)

  const listProps = renderList.firstCall.args[0]
  expect(listProps.style).toEqual({
    position: 'relative',
    minHeight: '100%',
    width: '100%',
    height: totalHeight
  })

  // Should render only-visible child rows.
  expect(child.callCount).toBe(8)

  clock.runAll()

  // Should not-render after setDebouncedHeightCache.
  expect(child.callCount).toBe(8)

  const childProps = child.firstCall.args[0]

  expect(childProps.row).toEqual({ id: 23 })
  expect(childProps.index).toEqual(22)
  expect(childProps.setSizeRef).toBeInstanceOf(Function)
  expect(childProps.style).toEqual({
    position: 'absolute',
    bottom: 2200,
    left: 0,
    minHeight: 100
  })

  const lastCallChildProps = child.lastCall.args[0]

  expect(lastCallChildProps.row).toEqual({ id: 30 })
  expect(lastCallChildProps.index).toEqual(29)
  expect(lastCallChildProps.setSizeRef).toBeInstanceOf(Function)
  expect(lastCallChildProps.style).toEqual({
    position: 'absolute',
    bottom: 2900,
    left: 0,
    minHeight: 100
  })

  // Testing for snapshot.
  expect(tree.toJSON()).toMatchSnapshot()
})
