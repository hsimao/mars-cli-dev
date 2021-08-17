'use strict'

module.exports = core

const path = require('path')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const rootCheck = require('root-check')
const dotenv = require('dotenv')
const minimist = require('minimist')
const pkg = require('../package.json')
const log = require('@mars-cli-dev/log')
const { getNpmSemverVersion } = require('@mars-cli-dev/get-npm-info')
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./constant')

async function core() {
  try {
    checkVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    await checkGlobalUpdate()
  } catch (e) {
    log.error(e.message)
  }
}

async function checkGlobalUpdate() {
  const currentVersion = pkg.version
  const npmName = pkg.name
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(
        `更新提示：當前版本: ${currentVersion}, 最新版本: ${lastVersion}\n npm install -g ${npmName}@${lastVersion}`
      )
    )
  }
}

function checkEnv() {
  // 判斷用戶根目錄是否有 .env 檔案, 有則合併到 process.env 內
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({ path: path.resolve(userHome, '.env') })
  }
  createDefaultConfig()
  log.verbose('環境變數', process.env)
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  }
  if (process.env.CLI_HOME) {
    cliConfig.cliHome = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig.cliHome = path.join(userHome, DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
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
