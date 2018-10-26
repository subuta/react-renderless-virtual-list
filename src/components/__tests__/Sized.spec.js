import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { create } from 'react-test-renderer'

import Sized from 'src/components/Sized'

test('should render with size.', () => {
  const child = sinon.spy(() => (
    <span>hoge</span>
  ))

  mount(
    <Sized>
      {child}
    </Sized>
  )

  // Should call child.
  expect(child.callCount).toBe(1)

  let props = child.firstCall.args[0]

  // Should exports props
  expect(props.size).toEqual({ height: 0, width: 0 })
})
