import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'

import {
  compose
} from 'recompose'

import ResizeObserver from 'resize-observer-polyfill'

const mockedObserve = jest.fn()
const mockedUnobserve = jest.fn()

// Mock for simulate ResizeObserver at jest(with jsdom) environment.
jest.mock('resize-observer-polyfill', () => {
  return jest.fn().mockImplementation(() => {
    return {
      observe: mockedObserve,
      unobserve: mockedUnobserve
    }
  })
})

let clock

beforeEach(() => {
  clock = sinon.useFakeTimers()
  ResizeObserver.mockClear();
  mockedObserve.mockClear();
  mockedUnobserve.mockClear();
})

afterEach(() => {
  clock.restore()
})

test('should have initialProps', () => {
  const withSize = require('src/hocs/withSize').default

  const component = sinon.spy(() => null)
  component.displayName = 'component'

  const enhance = compose(
    withSize
  )

  const Component = enhance(component)

  mount(<Component />)
  expect(component.callCount).toBe(1)

  let props = component.firstCall.args[0]

  // Should exports props
  expect(props.size).toEqual({ height: 0, width: 0 })
  //
  // // Should exports handlers
  expect(props.setSizeRef).toBeInstanceOf(Function)
})

test('setSize on resize of node', () => {
  const withSize = require('src/hocs/withSize').default

  const component = sinon.spy((props) => (
    <div ref={props.setSizeRef}></div>
  ))
  component.displayName = 'component'

  const enhance = compose(
    withSize
  )

  ResizeObserver.mockImplementationOnce(cb => {
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

  const Component = enhance(component)

  const wrapper = mount(<Component />)
  expect(component.callCount).toBe(1)

  let props = component.firstCall.args[0]
  expect(props.size).toEqual({ height: 0, width: 0 })

  expect(ResizeObserver).toHaveBeenCalledTimes(1)
  expect(mockedObserve).toHaveBeenCalledTimes(1)
  expect(mockedUnobserve).toHaveBeenCalledTimes(0)

  clock.next()

  expect(component.callCount).toBe(2)
  props = component.secondCall.args[0]
  expect(props.size).toEqual({ height: 200, width: 200 })

  wrapper.unmount()

  expect(mockedUnobserve).toHaveBeenCalledTimes(1)
})
