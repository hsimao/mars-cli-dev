'use strict'

const Command = require('@mars-cli-dev/command')
const log = require('@mars-cli-dev/log')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.opts().force
    log.verbose('projectName: ', this.projectName)
    log.verbose('force', this.force)
  }

  exec() {
    console.log('init 業務邏輯')
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
