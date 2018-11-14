import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'

import {
  compose
} from 'recompose'

import withScroll from 'src/hocs/withScroll'

let clock

beforeEach(() => {
  clock = sinon.useFakeTimers()
})

afterEach(() => {
  clock.restore()
})

test('should have initialProps', () => {
  const component = sinon.spy(() => null)
  component.displayName = 'component'

  const enhance = compose(
    withScroll
  )

  const Component = enhance(component)

  mount(<Component />)
  expect(component.callCount).toBe(1)

  let props = component.firstCall.args[0]

  // Should exports props
  expect(props.scrollTop).toBe(0)
  expect(props.scrollReason).toBe(null)

  // Should exports handlers
  expect(props._onScroll).toBeInstanceOf(Function)
  expect(props.setScrollContainerRef).toBeInstanceOf(Function)
  expect(props.requestScrollTo).toBeInstanceOf(Function)
})

test('_onScroll/requestScrollTo should not re-render for same scrollTop', () => {
  const component = sinon.spy(() => null)
  component.displayName = 'component'

  const enhance = compose(
    withScroll
  )

  const Component = enhance(component)

  mount(<Component />)
  expect(component.callCount).toBe(1)

  let props = component.firstCall.args[0]

  props._onScroll(0)
  props.requestScrollTo(0)

  // Should not update.
  expect(component.callCount).toBe(1)
})

test('_onScroll should set scrollTop with reason', () => {
  const component = sinon.spy(() => null)
  component.displayName = 'component'

  const enhance = compose(
    withScroll
  )

  const Component = enhance(component)

  mount(<Component />)
  expect(component.callCount).toBe(1)

  let props = component.firstCall.args[0]
  expect(props.scrollTop).toBe(0)
  expect(props.scrollReason).toBe(null)

  props._onScroll(100)

  // Should update.
  expect(component.callCount).toBe(2)

  props = component.secondCall.args[0]

  expect(props.scrollTop).toBe(100)
  expect(props.scrollReason).toBe('SCROLL_REASON_ON_SCROLL_EVENT')
})

test('requestScrollTo should set scrollTop with reason', () => {
  const spiedRef = sinon.stub({
    scrollTop: 100,
    addEventListener: () => {},
    removeEventListener: () => {}
  })

  const component = sinon.spy((props) => (
    <div ref={() => props.setScrollContainerRef(spiedRef)}></div>
  ))

  component.displayName = 'component'

  const enhance = compose(
    withScroll
  )

  const Component = enhance(component)

  mount(<Component />)
  expect(component.callCount).toBe(1)

  let props = component.firstCall.args[0]
  expect(props.scrollTop).toBe(0)
  expect(props.scrollReason).toBe(null)

  // Should not changed.
  expect(spiedRef.scrollTop).toBe(100)

  props.requestScrollTo(300)

  // Should update.
  expect(component.callCount).toBe(2)

  props = component.secondCall.args[0]

  expect(props.scrollTop).toBe(300)
  expect(props.scrollReason).toBe('SCROLL_REASON_REQUESTED')

  clock.runAll()

  // Should changed to requested scrollTop.
  expect(spiedRef.scrollTop).toBe(300)
  expect(props.scrollReason).toBe('SCROLL_REASON_REQUESTED')
})

test('setScrollContainerRef should bind onScroll event', () => {
  const spiedRef = sinon.stub({
    scrollTop: 100,
    addEventListener: () => {},
    removeEventListener: () => {}
  })

  const component = sinon.spy((props) => (
    <div ref={() => props.setScrollContainerRef(spiedRef)}></div>
  ))
  component.displayName = 'component'

  const enhance = compose(
    withScroll
  )

  const Component = enhance(component)

  expect(spiedRef.addEventListener.calledOnce).toBe(false)
  expect(spiedRef.removeEventListener.calledOnce).toBe(false)

  const wrapper = mount(<Component />)

  expect(component.callCount).toBe(1)

  let props = component.firstCall.args[0]

  expect(props.scrollTop).toBe(0)
  expect(props.scrollReason).toBe(null)

  expect(spiedRef.addEventListener.calledOnce).toBe(true)

  // Wait for raf.
  clock.next()

  wrapper.unmount()
  expect(spiedRef.removeEventListener.calledOnce).toBe(true)
})
