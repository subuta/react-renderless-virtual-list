import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'

import _ from 'lodash'

import VirtualListItem from 'src/components/VirtualListItem'

// Mock withSize while testing.
jest.mock('src/hocs/withSize', () => {
  return jest.fn((Component) => Component)
})

test('should render with initialProps.', () => {
  const child = sinon.spy(() => <span>hoge</span>)

  mount(
    <VirtualListItem>
      {child}
    </VirtualListItem>
  )

  // Should call child.
  expect(child.callCount).toBe(1)

  let props = child.firstCall.args[0]

  // Should exports props
  expect(_.has(props, 'row')).toBe(true)
  expect(_.has(props, 'index')).toBe(true)
})

test('should render as pure.', () => {
  const child = sinon.spy(() => <span>hoge</span>)

  const initialProps = {}

  const wrapper = mount(
    <VirtualListItem {...initialProps}>
      {child}
    </VirtualListItem>
  )

  // Should call child.
  expect(child.callCount).toBe(1)

  let props = child.firstCall.args[0]

  // Should not re-render if props not changed.
  wrapper.setProps(initialProps)
  expect(child.callCount).toBe(1)

  // Should exports props
  expect(_.has(props, 'row')).toBe(true)
  expect(_.has(props, 'index')).toBe(true)
})

test('should render with style and reversed.', () => {
  const child = sinon.spy(() => <span>hoge</span>)

  const wrapper = mount(
    <VirtualListItem
      startOfRows={0}
      size={{ height: 100, width: 100 }}
      reversed
    >
      {child}
    </VirtualListItem>
  )

  // Should call child.
  expect(child.callCount).toBe(1)

  let childProps = wrapper.find('span').props()

  // Should exports props
  expect(childProps.style).toEqual({
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 100,
    width: 100
  })
})

test('should render with style when size set.', () => {
  const child = sinon.spy(() => <span>hoge</span>)
  const onMeasure = sinon.spy()

  const wrapper = mount(
    <VirtualListItem
      index={0}
      startOfRows={0}
      size={{ height: 100, width: 100 }}
      onMeasure={onMeasure}
    >
      {child}
    </VirtualListItem>
  )

  // Should call child.
  expect(child.callCount).toBe(1)
  expect(onMeasure.callCount).toBe(1)

  expect(onMeasure.firstCall.args).toEqual([0, { height: 100, width: 100 }])

  let childProps = wrapper.find('span').props()

  // Should exports props
  expect(childProps.style).toEqual({
    position: 'absolute',
    top: 0,
    left: 0,
    height: 100,
    width: 100
  })

  // When size and startOfRows changed.
  wrapper.setProps({
    startOfRows: 100,
    size: {
      height: 200,
      width: 200
    }
  })

  // Should re-render child.
  expect(child.callCount).toBe(2)
  expect(onMeasure.callCount).toBe(2)

  expect(onMeasure.secondCall.args).toEqual([0, { height: 200, width: 200 }])

  childProps = wrapper.find('span').props()

  // With latest styles.
  expect(childProps.style).toEqual({
    position: 'absolute',
    top: 100,
    left: 0,
    height: 200,
    width: 200
  })
})
