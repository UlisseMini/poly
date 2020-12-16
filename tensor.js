/* --------------- Basic Tensor math library ----------------- */

// why javascript... why?
function eq(a, b) {
  if (a instanceof Array && b instanceof Array) {
    return a.length === b.length && a.every((v,i) => v === b[i])
  }

  return a === b
}

// No operator overloading support >_<
// Also super slow but its just a demo leave me alone
class Tensor {
  constructor(xs) {
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

    // Use proxy to overload indexing
    return new Proxy(this, {
      get: function(target, prop) {
        // console.log('get', target, prop)
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
      }
    })
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

  // TODO: Make these methods work piecewise for tensor values.

  add(x)  {
    if (x instanceof Tensor) {
      // TODO SHAPES
    } else {
      return this.map(y => x+y)
    }
  }
  add_(x) { return this.map_(y => x+y) }

  sub(x)  { return this.add(-x) }
  sub_(x) { return this.add_(-x) }

  mul(x)  { return this.map(y => x*y) }
  mul_(x) { return this.map_(y => x*y) }

  div(x)  { return this.mul(1/x) }
  div_(x) { return this.mul_(1/x) }

  pretty() {
    let children = this.v.map(x =>
      (x instanceof Tensor) ? '['+x.v.join(', ')+']' : x.toString())
    // console.log(children)
    return children.join('\n')
  }
}


if (module) module.exports = Tensor
