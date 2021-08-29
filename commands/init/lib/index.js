'use strict'

const inquirer = require('inquirer')
const fsExtra = require('fs-extra')
const semver = require('semver')
const Command = require('@mars-cli-dev/command')
const log = require('@mars-cli-dev/log')

const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.force
    log.verbose('projectName: ', this.projectName)
    log.verbose('force', this.force)
  }

  async exec() {
    try {
      console.log('init 業務邏輯')
      // 1. 準備階段
      const projectInfo = await this.prepare()
      if (projectInfo) {
        log.verbose('projcetInfo', projectInfo)
        this.projectInfo = projectInfo
        this.downloadTemplate()
        // 2. 下載模板
      }
      // 3. 安裝模板
    } catch (e) {
      log.error(e.message)
    }
  }

  async prepare() {
    const template = await getProjectTemplate()

    if (!template || !template.length) {
      throw new Error('沒有項目模板')
    }
    this.template = template

    const localPath = process.cwd()

    // 1. 判斷當前目錄是否為空
    if (!this.isDirEmpty(localPath)) {
      let isContinue = false

      if (!this.force) {
        const answer = await inquirer.prompt({
          type: 'confirm',
          name: 'isContinue',
          message: '當前目錄不為空, 是否繼續創建項目',
          default: false,
        })

        isContinue = answer.isContinue

        if (!isContinue) {
          return
        }
      }

      // 2. 是否強制更新
      if (isContinue || this.force) {
        // 二次確認是否刪除該目錄下所有檔案
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          message: '是否要清空當前目錄下所有檔案',
          default: false,
        })
        if (confirmDelete) {
          // 清空當前資料夾內所有檔案
          fsExtra.emptyDirSync(localPath)
        }
      }
    }
    return this.getProjectInfo()
  }

  async getProjectInfo() {
    // 3. 選擇創建項目或組件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '請選擇項目類型',
      default: TYPE_PROJECT,
      choices: [
        { name: '項目', value: TYPE_PROJECT },
        { name: '組件', value: TYPE_COMPONENT },
      ],
    })
    log.verbose('type', type)

    let projectInfo = {}

    if (type === TYPE_PROJECT) {
      const info = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '請輸入項目名稱',
          default: '',
          validate: function (value) {
            // 字首必須為英文
            // 字尾必須為英文或數字
            // 允許 "-_" 特殊符號
            // 合法：a, aaa, bbb, a-b, a_b, a_b_c, a-b1-c1, a_b1_c1
            // 不合法：1, a_, a-, a_1, a-1
            const done = this.async()

            setTimeout(() => {
              // prettier-ignore
              if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(value)) {
                done('請輸入合法的項目名稱, 例如：a, aaa, a-b, a_b, a_b_c, a-b1-c1, a_b1_c1')
                return
              }
              done(null, true)
            }, 0)
          },
        },
        {
          type: 'input',
          name: 'version',
          message: '請輸入版本號',
          default: '1.0.0',
          validate: function (value) {
            // 合法 1.0.0, v1.0.1
            // 不合法 1, 1.0, 123
            const done = this.async()

            setTimeout(() => {
              if (!semver.valid(value)) {
                done('請輸入合法的版本號, 例如：1.0.0, v1.0.1')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: function (value) {
            return !!semver.valid(value) ? semver.valid(value) : value
          },
        },
        // 選擇 template
        {
          type: 'list',
          name: 'projectTemplate',
          message: '請選擇項目模板',
          choices: this.createTemplateChoice(),
        },
      ])

      projectInfo = {
        type,
        ...info,
      }
    } else if (type === TYPE_COMPONENT) {
    }

    return projectInfo
  }

  createTemplateChoice() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name,
    }))
  }

  downloadTemplate() {
    console.log('template', this.template)
    console.log('projectInfo', this.projectInfo)

    // 1. 通過項目模板 API 獲取模板資訊
    // 1.1 使用 egg.js 建立 api 服務
    // 1.2 通過 npm 儲存項目模板
    // 1.3 將項目模板資訊儲存到 mongodb 資料庫中
    // 1.4 通過 egg.js api 取得 mondodb 中的模板資料
  }

  isDirEmpty(path) {
    let fileList = fs.readdirSync(path)

    // 過濾掉 node_modules 名稱以及 . 開頭的檔案
    fileList = fileList.filter((file) => {
      return !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    })
    return !fileList || fileList.length <= 0
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
