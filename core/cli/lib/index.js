'use strict'

module.exports = core

const semver = require('semver')
const colors = require('colors')
const pkg = require('../package.json')
const log = require('@mars-cli-dev/log')
const { LOWEST_NODE_VERSION } = require('./constant')

function core() {
  try {
    checkVersion()
    checkNodeVersion()
  } catch (e) {
    log.error(e.message)
  }
}

function checkNodeVersion() {
  if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(
        `mars-cli-dev 需要安裝 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`
      )
    )
  }
}

function checkVersion() {
  log.info('cli', `version: ${pkg.version}`)
}
