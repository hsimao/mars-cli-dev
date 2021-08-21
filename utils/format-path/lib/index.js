'use strict'
const path = require('path')

function formatPath(p) {
  if (p && typeof p === 'string') {
    if (path.sep === '/') {
      return p
    }
    return p.replace(/\\/g, '/')
  }
  return p
}

module.exports = formatPath
