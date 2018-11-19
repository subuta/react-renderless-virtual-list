import _ from 'lodash'

class VirtualListState {
  constructor (heights, groupIndices) {
    this.reset(heights, groupIndices)
  }

  reset (heights, groupIndices) {
    this._setRowHeights(heights)
    this._setGroupIndices(groupIndices)
  }

  _setRowHeights (heights = []) {
    let sum = 0
    this.fromOfRows = _.transform(heights, (result, height, i) => {
      result.set(sum += height, i)
    }, new Map())

    this.totalHeight = _.sum(heights)
    this.heights = heights
  }

  _setGroupIndices (groupIndices = []) {
    this.groupHeights = new Map()

    let lastIndex = 0
    let sumOfHeights = 0

    _.each(groupIndices, (index) => {
      const groupHeight = _.sum(this.heights.slice(lastIndex, index))

      this.groupHeights.set(index, {
        height: groupHeight,
        from: sumOfHeights
      })

      sumOfHeights += groupHeight
      lastIndex = index
    })
  }

  getTotalHeight () {
    return this.totalHeight
  }

  getGroupHeight (index) {
    return this.groupHeights.get(index)
  }

  getFromOfRows () {
    return Array.from(this.fromOfRows.keys())
  }

  getFromPosition (index) {
    if (index === 0) return 0
    return this.getFromOfRows()[index - 1] || 0
  }

  findVisibleIndex (fromPosition, toPosition) {
    const foundFromPosition = _.find(this.getFromOfRows(), (sum) => sum >= fromPosition)
    const foundToPosition = _.find(this.getFromOfRows(), (sum) => sum >= toPosition)

    const from = this.fromOfRows.get(foundFromPosition)
    const to = this.fromOfRows.get(foundToPosition)

    return {
      from,
      to,
      // Start position should not includes edge value.
      fromPosition: this.getFromPosition(from),
      toPosition: foundToPosition
    }
  }

  findOverScanIndex (fromPosition, toPosition, overScanCount = 0) {
    const visibleIndex = this.findVisibleIndex(fromPosition, toPosition)

    const from = (visibleIndex.from - overScanCount) >= 0 ? visibleIndex.from - overScanCount : 0
    const to = (visibleIndex.to + overScanCount) <= this.heights.length - 1 ? visibleIndex.to + overScanCount : this.heights.length - 1

    return {
      from,
      to,
      // Start position should not includes edge value.
      fromPosition: this.getFromPosition(from),
      toPosition: this.getFromOfRows()[to]
    }
  }
}

export default VirtualListState
