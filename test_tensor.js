/* --------------------------- Tests  --------------------------- */

const assert = require('assert').strict
const Tensor = require('./tensor.js')

describe('Tensor', () => {
  describe('map', () => {
    it('should distribute over each number', () => {
      const t = new Tensor([1,2,3])
      const newT = t.map((v) => v+1)
      assert.deepEqual(newT.v, [2,3,4]) // new should be changed
      assert.deepEqual(t.v, [1,2,3]) // old should be the same
    })


    it('should distribute over each number in sub-tensors', () => {
      const t = new Tensor([
        [1,2,3],
        [4,5,6],
        [7,8,9],
      ])

      const newT = t.map((v) => v-1)
      assert.deepEqual(newT.asVectors(), [
        [0,1,2],
        [3,4,5],
        [6,7,8],
      ])
    })
  })

  describe('map_', () => {
    it('should distribute over each number', () => {
      const t = new Tensor([1,2,3])
      const newT = t.map_((v) => v+1)

      // check reference equality, t.map_ is implace
      // for some wierd reason I coulden't check reference equality
      // of t == newT, it kept failing.
      assert.equal(t.v, newT.v)

      assert.deepEqual(newT.v, [2,3,4]) // new should be changed
      assert.deepEqual(t.v, [2,3,4]) // old should be changed
    })

    it('should distribute over each number in sub-tensors', () => {
      const t = new Tensor([
        [1,2,3],
        [4,5,6],
        [7,8,9],
      ])

      const newT = t.map_((v) => v-1)
      // todo: check reference equality.
      assert.deepEqual(newT.asVectors(), t.asVectors())
      assert.deepEqual(newT.asVectors(), [
        [0,1,2],
        [3,4,5],
        [6,7,8],
      ])
    })
  })

  describe('shapes', () => {
    it('should define 1d shapes with a scalar', () => {
      let t = new Tensor([1,2,3])
      assert.deepEqual(t.shape, [3])

      t = new Tensor([1,-2,3,9])
      assert.deepEqual(t.shape, [4])
    })


    it('should define 2d shapes with a 2x2 shape', () => {
      let t = new Tensor([
        [1,2,3],
        [2,3,4],
      ])

      assert.deepEqual(t.shape, [2, 3])

      t = new Tensor([
        [1,2,3],
        [2,3,4],
        [8,2,4],
      ])

      assert.deepEqual(t.shape, [3, 3])
    })
  })

  // todo: test implace as well
  // todo: implace generic test generator?
  describe('add', () => {
    it('should add vectors piecewise', () => {
      let a = new Tensor([1,2,3])
      let b = new Tensor([2,3,4])

      assert.deepEqual(a.add(b), [3,5,7])
      assert.deepEqual(b.add(a), [3,5,7])
    })

    it('should raise error with mismatched shapes', () => {
      let a = new Tensor([1,2,3])
      let b = new Tensor([1,2,3,5])

      assert.throws(() => a.add(b), /shape/)
      assert.throws(() => b.add(a), /shape/)
    })
  })
})
