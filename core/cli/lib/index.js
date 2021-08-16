'use strict'

module.exports = core

const pkg = require('../package.json')
const log = require('@mars-cli-dev/log')

function core() {
  console.log('exec core')
  checkVersion()
  // TODO
}

function checkVersion() {
  log.info('cli', `version: ${pkg.version}`)
}
