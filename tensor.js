/* --------------- Basic Tensor math library ----------------- */
// TODO: Make np object and mimic numpy more
// TODO: .length in Proxy object
// Note: Efficency is *not* a priority, I will eventually setup benchmarks
//       and optimize, but not yet!

// why javascript... why?
function eq(a, b) {
  if (a instanceof Array && b instanceof Array) {
    return a.length === b.length && a.every((v,i) => v === b[i])
  }

  return a === b
}

function proxyTensor(tensor) {
  // Use proxy to overload indexing
  return new Proxy(tensor, {
    get: function(target, prop) {
      // console.log('get', target, prop)
      if (prop === 'T') { return target.transpose() }
      if (typeof prop === 'symbol') {
        return target[prop]
      }

      const v = isNaN(parseInt(prop)) ? target[prop] : target.v[prop]
      if (typeof v === 'function') {
        return v.bind(target)
      }

      return v
    },

    set: function(target, prop, val) {
      // console.log('set', target, prop, val)
      target.v[prop] = val
      return true
    }
  })
}

// No operator overloading support >_<
// Also super slow but its just a demo leave me alone
class Tensor {
  constructor(xs) {
    if (xs instanceof Tensor) return proxyTensor(xs)

    // todo: throw exception for xs /= {null, array}

    if (xs != null && xs instanceof Array) {
      this.v = xs.map(v =>
        (v instanceof Array) ? new Tensor(v) : v)
    } else {
      this.v = []
    }

    // Figure out our shape
    this.shape = [this.v.length]
    if (this.v[0] instanceof Tensor) {
      this.shape = this.shape.concat(this.v[0].shape)

      // Make sure children are all of the same shape
      for (let i = 0; i < this.v.length; i++) {
        const got = this.v[i].shape
        const want = this.shape.slice(1)
        if (!eq(got, want)) {
          throw Error(`child ${i} invalid shape ${got} want ${want}`)
        }
      }
    }

    return proxyTensor(this)
  }

  static zeros(shape) {
    if (shape.length == 1) {
      return new Tensor(new Array(shape[0]).fill(0))
    } else {
      // If you put Tensor.zeros inside fill, it will use the reference
      // and they'll all be pointing to eachother, so we use map.
      return new Tensor(new Array(shape[0])
        .fill(null).map(_ => Tensor.zeros(shape.slice(1))))
    }
  }

  map(f) {
    return new Tensor(this.v.map(x => 
      (x instanceof Tensor) ? x.map(f) : f(x)
    ))
  }

  map_(f) {
    for (let i = 0; i < this.v.length; i++) {
      if (this.v[i] instanceof Tensor) {
        this.v[i].map_(f)
      } else {
        this.v[i] = f(this.v[i])
      }
    }
    return this
  }

  asVectors() {
    let v = []
    for (let i = 0; i < this.v.length; i++) {
      if (this.v[i] instanceof Tensor) {
        v.push(this.v[i].asVectors())
      } else {
        v.push(this.v[i])
      }
    }
    return v
  }
  
  // TODO: implement op_ for inplace
  op(f, k, other) {
    // f(this.v[i], other.v[i]) <-- important for non commutative

    if (other instanceof Tensor) {
      // --> if the shapes are not equal everything breaks <--
      if (!eq(this.shape, other.shape)) {
        throw Error(`mismatched shapes, ${this.shape} !== ${other.shape}`)
      }

      let result = []

      // check outside to avoid reflection in the critical path
      if (this.shape.length == 1) {
        for (let i = 0; i < this.shape[0]; i++) {
          result.push(f(this.v[i], other.v[i]))
        }
      } else {
        for (let i = 0; i < this.shape[0]; i++) {
          // use k as key for the method to use on tensors, so we can recurse
          result.push(this.v[i][k](other.v[i]))
        }
      }

      return new Tensor(result)
    } else {
      return this.map(y => f(y, other))
    }
  }

  add(x)  { return this.op((x,y) => x+y, 'add', x) }
  add_(x) { return this.map_(y => x+y) }

  sub(x)  { return this.add(-x) }
  sub_(x) { return this.add_(-x) }

  mul(x)  { return this.op((x,y) => x*y, 'mul', x) }
  mul_(x) { return this.map_(y => x*y) }

  div(x)  { return this.mul(1/x) }
  div_(x) { return this.mul_(1/x) }

  // todo: support multiple unravel orderings
  // NOTE: Ravel returns an array of scalars, no tensors!
  ravel() {
    if (this.shape.length == 1) { // just a vector of scalers
      return this.v
    } else { // recurse
      let res = []

      for (let i = 0; i < this.v.length; i++) {
        res = res.concat(this.v[i].ravel())
      }

      return res
    }
  }

  reshape(shape) {
    let unraveled_rev = this.ravel().reverse()
    let res = Tensor.zeros(shape)

    // this is kind of map abuse
    res.map_(_ => unraveled_rev.pop())

    return res
  }

  // todo: add .T prop in Proxy class to act like numpy
  // todo: multidimensional array support
  transpose() {
    // Do not change a vector
    if (this.shape.length === 1) return this

    const nrows = this.shape[0]
    const ncols = this.shape[1]

    let res = (new Array(ncols)).fill(null).map(_ => new Array(nrows))
    for (let i = 0; i < nrows; i++) {
      for (let j = 0; j < ncols; j++) {
        res[j][i] = this.v[i][j]
      }
    }

    return new Tensor(res)
  }

  // only defined for vectors for now.
  dot(b) {
    const a = this
    if (a.shape.length !== 1) { throw Error(`dot only supports vectors, this.shape is ${a.shape}`) } 
    if (b.shape.length !== 1) { throw Error(`dot only supports vectors, b.shape is ${b.shape}`) } 
    if (b.shape[0] !== a.shape[0]) { throw Error(`b.shape(${b.shape}) != a.shape(${a.shape})`) } 

    return a.v.map((v, i) => v*b[i]).reduce((x,y) => x+y, 0)
  }

  // Matrix multiplication, where if A=this B=x, this is AB
  // (not defined for higher dimensional tensors yet)
  // TODO: clean up this code, write an algorithm that doesn't use B.transpose()
  matmul(B) {
    if (B == null) { throw Error(`cannot dot with ${B}`) }

    // aliases to make my life easier
    const [n, m] = this.shape
    const [m_, p] = B.shape

    // (n by m) * (m by p) = (n by p)
    if (m === m_) {
      if (p == null || p === 1) {
        // matrix-vector product

        let result = Tensor.zeros([n])
        for (let i = 0; i < n; i++) {
          result[i] = B.dot(this.v[i])
        }
        return result
      } else {
        // matrix-matrix product

        let result = Tensor.zeros([n, p])

        const BT = B.transpose()

        for (let i = 0; i < n; i++) { // for row in A
          for (let j = 0; j < p; j++) { // for col in B
            const col = BT[j]
            const row = this.v[i] // todo: why v needed? I thought proxy ):
            result[i][j] = row.dot(col)
          }
        }

        return result
      }

    } else {
    // TODO: throw numpy styled error
    // matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc signature (n?,k),(k,m?)->(n?,m?) (size 2 is different from 3
    }


    // Error!
    throw Error(`(shape ${this.shape}).matmul((shape ${x.shape})) is not defined`)
  }

  pretty() {
    let children = this.v.map(x =>
      (x instanceof Tensor) ? '['+x.v.join(', ')+']' : x.toString())
    // console.log(children)
    return children.join('\n')
  }

  augment(vector) {
    if (this.shape.length !== 2) throw Error('augment only supports matrices')
    if (this.shape[0] !== vector.shape[0]) throw Error('shape mismatch')
    const [n, m] = this.shape

    let AUG = this.asVectors()
    for (let row = 0; row < n; row++) {
      AUG[row].push(vector.v[row])
    }

    return new Tensor(AUG)
  }


  // Solve a system of equations using gaussian elimination
  // TODO:
  //   Row exchanges when pivot is 0
  //   LU factorization for solving multiple outputs efficently
  //   support (n,m) systems
  static solve(A, b) {
    if (A.shape.length !== 2) {
      throw Error(`Can only solve (n,n) systems`)
    }
    if (b.shape.length !== 1 || b.shape[0] !== A.shape[0]) {
      throw Error(`Can only solve (n,) outputs`)
    }

    const n = A.shape[0]

    // Augment the matrix
    // Calling it R because R[i] is row i
    let R = A.augment(b)


    // TODO: Make this work for any matrix, not just 2x2

    // E(2,1)
    let pivot = R[0][0]
    let target = R[1][0]
    console.log('pivot', pivot, 'target', target)
    R[1] = R[1].add(R[0].mul(-target/pivot))

    console.log('R')
    console.log(R.pretty())

    // Back substitution
    for (let i = R.shape[0]-1; i >= 0; i--) {
      // TODO
    }

    return R
  }
}

if (module) module.exports = Tensor
