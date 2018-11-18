import sinon from 'sinon'
import _ from 'lodash'

import VirtualListState from 'src/utils/virtualListState'

beforeEach(() => {
})

afterEach(() => {
})

test('should have initial props', () => {
  const virtualListState = new VirtualListState()
  expect(virtualListState.heights).toEqual([])
})

test('should return totalHeight', () => {
  const virtualListState = new VirtualListState(_.times(10, () => 100))
  expect(virtualListState.getTotalHeight()).toEqual(1000)
})

test('should return visibleIndex', () => {
  const virtualListState = new VirtualListState(_.times(10, () => 100))

  expect(virtualListState.findVisibleIndex(0, 300)).toEqual({
    start: 0,
    startPos: 0,
    end: 2,
    endPos: 300
  })

  expect(virtualListState.findVisibleIndex(100, 300)).toEqual({
    start: 0,
    startPos: 0,
    end: 2,
    endPos: 300
  })

  expect(virtualListState.findVisibleIndex(101, 300)).toEqual({
    start: 1,
    startPos: 100,
    end: 2,
    endPos: 300
  })

  expect(virtualListState.findVisibleIndex(100, 301)).toEqual({
    start: 0,
    startPos: 0,
    end: 3,
    endPos: 400
  })
})

test('should return groupHeights', () => {
  const heights = [
    100, 100, 100, 50,
    100, 100, 100, 50,
    100, 100, 100, 100, 50
  ]

  const virtualListState = new VirtualListState(heights, [4, 8, 13])

  expect(virtualListState.getGroupHeight(4)).toEqual({ height: 350, startOfGroups: 0 })
  expect(virtualListState.getGroupHeight(8)).toEqual({ height: 350, startOfGroups: 350 })
  expect(virtualListState.getGroupHeight(13)).toEqual({ height: 450, startOfGroups: 700 })
})
