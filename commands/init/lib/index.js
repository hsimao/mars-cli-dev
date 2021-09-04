'use strict'

const inquirer = require('inquirer')
const fsExtra = require('fs-extra')
const semver = require('semver')
const userHome = require('user-home')
const Command = require('@mars-cli-dev/command')
const Package = require('@mars-cli-dev/package')
const log = require('@mars-cli-dev/log')

const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

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
        // 2. 下載模板
        log.verbose('projcetInfo', projectInfo)
        this.projectInfo = projectInfo
        await this.downloadTemplate()

        // 3. 安裝模板
        await this.installTemplate()
      }
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
          name: 'template',
          message: '請選擇項目模板',
          choices: this.createTemplateChoice(),
        },
      ])

      const selectedTemplate = this.template.find(
        (item) => item.npmName === info.template
      )

      projectInfo = {
        type,
        ...info,
        template: selectedTemplate,
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

  async installTemplate() {
    if (this.projectInfo?.template) {
      let type = this.projectInfo.template.type
      type = type ? type : TEMPLATE_TYPE_NORMAL

      switch (type) {
        case TEMPLATE_TYPE_NORMAL:
          this.installNormalTemplate()
          break
        case TEMPLATE_TYPE_CUSTOM:
          this.installCustomTemplate()
          break
        default:
          throw new Error('項目模板 type 無法判斷!')
      }
    } else {
      throw new Error('項目模板資訊不存在')
    }
  }

  async installNormalTemplate() {
    console.log('安裝標準模板')
    // 複製模板檔案到當前要安裝的位置
    try {
      console.log('正在安裝模板...')
      const templatePath = path.resolve(
        this.templateNpm.cacheFilePath,
        'template'
      )
      const targetPath = process.cwd()

      fsExtra.ensureDirSync(templatePath)
      fsExtra.ensureDirSync(targetPath)
      fsExtra.copySync(templatePath, targetPath)
      log.success('模板安裝完成')
    } catch (e) {
      throw e
    }
  }

  async installCustomTemplate() {
    console.log('安裝自定義模板')
  }

  async downloadTemplate() {
    const targetPath = path.resolve(userHome, '.mars-cli-dev', 'template')
    const storeDir = path.resolve(
      userHome,
      '.mars-cli-dev',
      'template',
      'node_modules'
    )

    const { npmName, version } = this.projectInfo.template

    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    })

    if (!(await templateNpm.exists())) {
      await templateNpm.install()
    } else {
      await templateNpm.update()
    }

    this.templateNpm = templateNpm
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
