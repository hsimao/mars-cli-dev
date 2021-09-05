'use strict'

const path = require('path')
const Package = require('@mars-cli-dev/package')
const log = require('@mars-cli-dev/log')
const { exec: spawn } = require('@mars-cli-dev/utils')

const SETTINGS = {
  init: '@mars-cli-dev/init',
}

const CACHE_DIR = 'dependencies'

async function exec() {
  let pkg
  let storeDir = ''
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  const cmdObj = arguments[arguments.length - 1]
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    // 生成緩存路徑
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    })

    if (await pkg.exists()) {
      // 更新 package
      await pkg.update()
    } else {
      // 安裝 package
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    })
  }

  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    try {
      // 使用 node 子進程來執行 require(rootFile).call(null, Array.from(arguments))
      // 將 require 要傳遞的資訊格式化, 並轉成字串, 再透過 node 指令執行
      const args = formatArgs(arguments)
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit', // 直接在將流跟父進程綁定, 就無需在子進程監聽了 child.stdout.on('data', ()=>{})
      })
      child.on('error', (e) => {
        log.error(e.message)
        process.exit(1)
      })
      child.on('exit', (e) => {
        log.verbose(`指令執行成功 ${e}`)
        process.exit(e)
      })
    } catch (e) {
      log.error(e.message)
    }
  }
}

function formatArgs(args) {
  const argsArray = Array.from(args)
  const cmd = argsArray[args.length - 1]
  const formatCmd = Object.create(null)

  // 重新過濾 cmd 資訊, 移除附加的方法, 以及下底線的屬性, 跟 parrent
  Object.keys(cmd).forEach((key) => {
    if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
      formatCmd[key] = cmd[key]
    }
  })

  // 將 cmd.opts() 內的所有參數抓出來存到 cmd 中
  Object.keys(cmd.opts()).forEach((key) => {
    formatCmd[key] = cmd.opts()[key]
  })

  argsArray[args.length - 1] = formatCmd

  return argsArray
}

module.exports = exec
