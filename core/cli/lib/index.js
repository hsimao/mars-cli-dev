'use strict'

module.exports = core

const semver = require('semver')
const colors = require('colors')
const rootCheck = require('root-check')
const pkg = require('../package.json')
const log = require('@mars-cli-dev/log')
const { LOWEST_NODE_VERSION } = require('./constant')

function core() {
  try {
    checkVersion()
    checkNodeVersion()
    checkRoot()
  } catch (e) {
    log.error(e.message)
  }
}

function checkRoot() {
  // 避免使用 root, 如果使用 sudo root 權限執行, 後續可能會出現許多權限報錯, 沒辦法讀寫檔案,
  // 使用 rootCheck 將自動降級
  rootCheck()
  console.warn('root', process.geteuid())
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
