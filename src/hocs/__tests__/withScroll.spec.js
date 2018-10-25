import React from 'react'
import { create } from 'react-test-renderer'

const Hoge = () => {
  return (
    <h1>hoge</h1>
  )
}

test('city database has Vienna', () => {
  const tree = create(<Hoge />).toJSON()
  expect(tree).toMatchSnapshot()
});
