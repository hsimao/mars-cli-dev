'use strict'

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]'
}

module.exports = {
  isObject,
  isArray,
}
