'use strict'

const Package = require('@mars-cli-dev/package')
const log = require('@mars-cli-dev/log')

const SETTINGS = {
  init: '@mars-cli-dev/init',
}

function exec() {
  const targetPath = process.env.CLI_TARGET_PATH

  const cmdObj = arguments[arguments.length - 1]
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    // 生成緩存路徑
    targetPath = ''
  }

  const pkg = new Package({
    targetPath,
    packageName,
    packageVersion,
  })
  console.log(pkg.getRootFile())
}

module.exports = exec
