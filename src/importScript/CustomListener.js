import { Python2Listener } from './generated/Python2Listener'

import { pyString } from './pyTypes'

function CustomListener ({ enterArglist, enterAssignment }) {
  Python2Listener.call(this)
  this.visited = new Set()
  this.vars = Object.create(null)
  this.enterArglistCb = enterArglist
  this.enterAssignmentCb = enterAssignment
  return this
}
CustomListener.prototype = Object.create(Python2Listener.prototype)
CustomListener.prototype.constructor = CustomListener
CustomListener.prototype.enterArglist = function (ctx) {
  if (this.visited.has(ctx)) {
    return
  }
  this.visited.add(ctx)

  const { funcName, varName } = this.processArgsCtx(ctx)
  const args = this.preprocessArgs(ctx)
  this.enterArglistCb(varName, funcName, args)
}
CustomListener.prototype.enterExpr_stmt = function (ctx) {
  if (ctx.children.length === 3 && ctx.children[1].getText() === '=') {
    const name = ctx.children[0].getText()
    const value = ctx.children[2]
    this.vars[name] = value
  }
}
CustomListener.prototype.processArgsCtx = function (argsCtx) {
  const funcCtx = argsCtx.parentCtx.parentCtx
  const funcNameIndex = funcCtx.children.indexOf(argsCtx.parentCtx) - 1
  const funcName = funcCtx.children[funcNameIndex].getText()

  let varName
  if (
    funcCtx.children.length >= 2 &&
    funcCtx.children[0].getText() === 'net' &&
    funcCtx.children[1].getText() === '.get'
  ) {
    varName = pyString(funcCtx.children[2].children[1].getText())
  } else if (funcNameIndex > 0) {
    varName = funcCtx.children[0].getText()
  } else {
    varName = null
  }

  return { varName, funcName }
}
CustomListener.prototype.preprocessArgs = function (argsCtx) {
  return argsCtx.children.map(child => {
    if (!child.children) {
      return child.getText()
    } else {
      return child.children.map(child => {
        const text = child.getText()
        if (text.startsWith('[')) {
          if (text === '[]') {
            return []
          } else {
            return text.substr(1, text.length - 2).split(',')
          }
        } else {
          return text
        }
      })
    }
  }).filter(val =>
    val !== ','
  ).reduce((acc, val, i, arr) => {
    if (val === '**') {
      // Ignore
    } else if (arr[i - 1] === '**') {
      try {
        const varName = val[0]
        const value = this.vars[varName] // ctx
          .getText() // Python dictionary
          .replace(/'/g, '"') // JSON (hopefully)
        const obj = JSON.parse(value)

        // Use the same format as use non dict values
        Object.keys(obj).forEach(key => {
          const val = obj[key]
          switch (typeof val) {
            case 'number':
              obj[key] = `${val}`
              break
            case 'string':
              obj[key] = `'${val}'`
              break
          }
        })

        Object.assign(acc, obj)
      } catch (error) {
        console.warn(error)
      }
    } else if (val.length === 1) {
      acc[i] = val[0]
    } else {
      acc[val[0]] = val[2]
    }
    return acc
  }, {})
}

export default CustomListener
