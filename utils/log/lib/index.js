'use strict'

const log = require('npmlog')

// 判斷 debug 模式
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'

// 新增前綴
log.heading = 'mars'

// 自定義 level
log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log
