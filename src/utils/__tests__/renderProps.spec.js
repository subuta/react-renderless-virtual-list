import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { create } from 'react-test-renderer'

import _ from 'lodash'

import {
  compose
} from 'recompose'

import renderProps from 'src/utils/renderProps'

test('should render children as render function', () => {
  const exposed = { hoge: 'hoge' }

  const Component = sinon.spy((props) => renderProps(props, exposed))
  const child = sinon.spy(() => null)

  mount(
    <Component>
      {child}
    </Component>
  )

  // Should call child.
  expect(child.callCount).toBe(1)

  let props = child.firstCall.args[0]

  // Should exports props
  expect(props).toEqual(exposed)
})

test('should render passed render function', () => {
  const exposed = { hoge: 'hoge' }

  const Component = sinon.spy((props) => renderProps(props, exposed))
  const child = sinon.spy(() => null)

  mount(
    <Component render={child} />
  )

  // Should call child.
  expect(child.callCount).toBe(1)

  let props = child.firstCall.args[0]

  // Should exports props
  expect(props).toEqual(exposed)
})

test('should render null', () => {
  const Component = sinon.spy((props) => renderProps(props, {}))

  const rendered = create(
    <Component />
  )

  // Should not render anything.
  expect(rendered.toJSON()).toBe(null)
})
