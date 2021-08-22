'use strict'

const semver = require('semver')
const colors = require('colors')
const log = require('@mars-cli-dev/log')
const { isArray } = require('@mars-cli-dev/utils')

const LOWEST_NODE_VERSION = '14.15.0'

class Command {
  constructor(argv) {
    this.validateArgv(argv)

    this._argv = argv

    new Promise((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain.then(() => this.checkNodeVersion())
      chain = chain.then(() => this.initArgs())
      chain = chain.then(() => this.init())
      chain = chain.then(() => this.exec())
      chain.catch((err) => log.error(err.message))
    })
  }

  init() {
    throw new Error('init 必須實現')
  }

  exec() {
    throw new Error('exec 必須實現')
  }

  validateArgv(argv) {
    if (!argv) {
      throw new Error(colors.red('參數不能為空!'))
    }

    if (!isArray(argv)) {
      throw new Error('參數必須為 Array')
    }

    if (!argv.length) {
      throw new Error('參數列表不能為空!')
    }
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1]
    this._argv = this._argv.slice(0, this._argv.length - 1)
  }

  checkNodeVersion() {
    if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
      throw new Error(
        colors.red(
          `mars-cli-dev 需要安裝 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`
        )
      )
    }
  }
}

module.exports = Command
