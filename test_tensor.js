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

  // todo: implace generic test generator?
  describe('add', () => {
    it('should add piecewise', () => {
      let a = new Tensor([1,2,3])
      assert.deepEqual(a.add(1).asVectors(), [2,3,4])

      a = new Tensor([
        [1,2,3],
        [2,3,4]
      ])

      assert.deepEqual(a.add(2).asVectors(), [
        [3,4,5],
        [4,5,6]
      ])
    })

    it('should add tensors piecewise', () => {
      let a = new Tensor([1,2,3])
      let b = new Tensor([2,3,4])

      assert.deepEqual(a.add(b).asVectors(), [3,5,7])
      assert.deepEqual(b.add(a).asVectors(), [3,5,7])
    })

    it('should raise error with mismatched shapes', () => {
      let a = new Tensor([1,2,3])
      let b = new Tensor([1,2,3,5])

      assert.throws(() => a.add(b), /shape/)
      assert.throws(() => b.add(a), /shape/)
    })
  })

  describe('mul', () => {
    it('should multiply piecewise', () => {
      let a = new Tensor([1,2,3])
      assert.deepEqual(a.mul(2).asVectors(), [2,4,6])

      a = new Tensor([
        [1,2,3],
        [2,3,4]
      ])

      assert.deepEqual(a.mul(2).asVectors(), [
        [2,4,6],
        [4,6,8]
      ])
    })

    it('should multiply tensors piecewise', () => {
      let a = new Tensor([1,2,3])
      let b = new Tensor([2,3,4])

      assert.deepEqual(a.mul(b).asVectors(), [2, 6, 12])
      assert.deepEqual(b.mul(a).asVectors(), [2, 6, 12])
    })

    it('should raise error with mismatched shapes', () => {
      let a = new Tensor([1,2,3])
      let b = new Tensor([1,2,3,5])

      assert.throws(() => a.mul(b), /shape/)
      assert.throws(() => b.mul(a), /shape/)
    })
  })
  
  describe('zeros', () => {
    it('should make a (n,) tensor of zeros', () => {
      let t = Tensor.zeros([3])
      assert.deepEqual(t.asVectors(), [0,0,0])
    })

    it('should make a (n,n) tensor of zeros', () => {
      let t = Tensor.zeros([3,3])
      assert.deepEqual(t.asVectors(), [
        [0,0,0],
        [0,0,0],
        [0,0,0]
      ])
    })

    it('should make a (n,n,n) tensor of zeros', () => {
      let t = Tensor.zeros([3,3,3])

      assert.deepEqual(t.asVectors(), [
        [[0,0,0],
        [0,0,0],
        [0,0,0]],

        [[0,0,0],
        [0,0,0],
        [0,0,0]],

        [[0,0,0],
        [0,0,0],
        [0,0,0]]
      ])
    })
  })

  describe('ravel', () => {
    it('should unravel a 2x2', () => {
      let t = new Tensor([
        [1,2],
        [3,4]
      ])
      assert.deepEqual(t.ravel(), [1,2,3,4])
    })

    it('should unravel a 3x2', () => {
      let t = new Tensor([
        [1,2],
        [3,4],
        [5,6]
      ])
      assert.deepEqual(t.ravel(), [1,2,3,4,5,6])
    })

    it('should unravel a 3x3', () => {
      let t = new Tensor([
        [1,2, -2],
        [3,4, -4],
        [5,6, -6]
      ])
      assert.deepEqual(t.ravel(), [1,2,-2,3,4,-4,5,6,-6])
    })
  })

  describe('reshape', () => {
    it('should reshape a 3x4 tensor to a 4x3 tensor', () => {
      let t = new Tensor([
        [1,2,3,4],
        [0,1,2,3],
        [-1,0,1,2],
      ])

      assert.deepEqual(t.reshape([4,3]).asVectors(), [
        [1, 2, 3],
        [4, 0, 1],
        [2, 3, -1],
        [0, 1, 2],
      ])
    })
  })

  describe('transpose', () => {
    it('should transpose a 3x2 matrix', () => {
      let z = new Tensor([
        [1,2],
        [3,4],
        [5,6],
      ])
      let res = z.transpose().asVectors()
      assert.deepEqual(res, [
        [1, 3, 5],
        [2, 4, 6],
      ])
    })

    it('should not change a row vector', () => {
      let z = new Tensor([1,2,3])
      assert.deepEqual(z.transpose().asVectors(), z.asVectors())
    })
  })

  describe('dot', () => {
    it('should dot vectors', () => {
      let a = new Tensor([1,2,3])
      let b = new Tensor([4,5,6])

      assert.equal(a.dot(b), 32)
    })

    // it('should error for non-vectors', () => {

    // })
  })

  describe('matmul', () => {
    it('should do matrix vector multiplication', () => {
      let A = new Tensor([
        [1, 2, 3],
        [3, 4, 5],
        [6, 7, 8]
      ])
      let x = new Tensor([1,2,3])

      assert.deepEqual(A.matmul(x).asVectors(), [14, 26, 44])
    })

    it('should do matrix matrix multiplication', () => {
      let A = new Tensor([
        [2, 3, 2],
        [0, 4, 4],
        [0, 3, 4]
      ])

      let B = new Tensor([
        [1, 2, 0],
        [1, 2, 2],
        [1, 0, 1]
      ])

      assert.deepEqual(A.matmul(B).asVectors(), [
        [ 7, 10,  8],
        [ 8,  8, 12],
        [ 7,  6, 10]
      ])
    })
  })

  describe('augment', () => {
    it('should augment a (2,2) matrix with a (2,) vector', () => {
      let A = new Tensor([
        [1, 2],
        [3, 4],
      ])
      let b = new Tensor([2, 4])
      let AUG = A.augment(b)
      assert.deepEqual(AUG.asVectors(), [
        [1,2,2],
        [3,4, 4],
      ])
    })
  })

  describe('solve', () => {
    it('should solve 2x2 systems of equations', () => {
      let A = new Tensor([
        [1, 2],
        [3, 4],
      ])
      let b = new Tensor([2, 4])
      let x = Tensor.solve(A, b)

      assert.deepEqual(A.matmul(x).asVectors(), b.asVectors())
    })
  })
})
