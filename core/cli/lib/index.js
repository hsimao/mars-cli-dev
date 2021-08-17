'use strict'

module.exports = core

const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const rootCheck = require('root-check')
const minimist = require('minimist')
const pkg = require('../package.json')
const log = require('@mars-cli-dev/log')
const { LOWEST_NODE_VERSION } = require('./constant')

function core() {
  try {
    checkVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    log.verbose('debug', 'test debug log')
  } catch (e) {
    log.error(e.message)
  }
}

function checkInputArgs() {
  const args = minimist(process.argv.slice(2))
  updateLogLevelEnv(args)
}

function updateLogLevelEnv(args) {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('當前用戶主目錄不存在!'))
  }
}

function checkRoot() {
  // 避免使用 root, 如果使用 sudo root 權限執行, 後續可能會出現許多權限報錯, 沒辦法讀寫檔案,
  // 使用 rootCheck 將自動降級
  rootCheck()
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
