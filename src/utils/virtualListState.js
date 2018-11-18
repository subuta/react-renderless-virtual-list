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
    this.startOfRows = _.transform(heights, (result, height, i) => {
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
        startOfGroups: sumOfHeights
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

  getStartOfRows () {
    return Array.from(this.startOfRows.keys())
  }

  getStartPos (index) {
    if (index === 0) return 0
    return this.getStartOfRows()[index - 1] || 0
  }

  findVisibleIndex (startPosArg, endPosArg) {
    const indexes = this.getStartOfRows()

    let startPos = _.find(indexes, (sum) => sum >= startPosArg)
    let endPos = _.find(indexes, (sum) => sum >= endPosArg)

    let startIndex = this.startOfRows.get(startPos)
    let endIndex = this.startOfRows.get(endPos)

    // Start position should not includes edge value.
    startPos = this.getStartPos(startIndex)

    return {
      start: startIndex,
      end: endIndex,
      startPos,
      endPos
    }
  }
}

export default VirtualListState
