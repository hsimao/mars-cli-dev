'use strict'

const Package = require('@mars-cli-dev/package')

function exec() {
  const pkg = new Package()
  console.warn('pkg', pkg)
  console.warn('exec path', process.env.CLI_TARGET_PATH)
  console.warn('exec path', process.env.CLI_HOME_PATH)
}

module.exports = exec
