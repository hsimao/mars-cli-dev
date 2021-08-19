'use strict'

module.exports = core

const path = require('path')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const commander = require('commander')
const pathExists = require('path-exists').sync
const rootCheck = require('root-check')
const dotenv = require('dotenv')
const pkg = require('../package.json')
const log = require('@mars-cli-dev/log')
const init = require('@mars-cli-dev/init')
const { getNpmSemverVersion } = require('@mars-cli-dev/get-npm-info')
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./constant')

const program = new commander.Command()

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (e) {
    log.error(e.message)
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否開啟 debug 模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地調試文件路徑', '')

  program
    .command('init [projectName]')
    .option('-f, --force', '是否強制初始化項目')
    .action(init)

  // 監聽 targetPath 設定到 env
  program.on('option:targetPath', () => {
    process.env.CLI_TARGET_PATH = program.opts().targetPath
  })

  // 開啟 debug 模式
  program.on('option:debug', () => {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
  })

  // 監聽未定義指令提示
  program.on('command:*', (obj) => {
    console.log(colors.red(`錯誤的指令: ${obj[0]}`))

    const availableCommands = program.commands.map((cmd) => cmd.name())
    if (availableCommands.length) {
      console.log(`可使用的指令: ${availableCommands.join(', ')}`)
    }
  })

  program.parse(process.argv)

  if (program.args && program.args.length < 1) {
    program.outputHelp()
    console.log() // NOTE: 讓 help 資訊底部多一行空白間隔
  }
}

async function prepare() {
  checkVersion()
  checkNodeVersion()
  checkRoot()
  checkUserHome()
  checkEnv()
  await checkGlobalUpdate()
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
