'use strict'

const path = require('path')
const Package = require('@mars-cli-dev/package')
const log = require('@mars-cli-dev/log')

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

    if (pkg.exists()) {
      // 更新 package
    } else {
      console.log('install')
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
    require(rootFile).apply(null, arguments)
  }
}

module.exports = exec
