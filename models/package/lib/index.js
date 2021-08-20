'use strict'

const path = require('path')
const pkgDir = require('pkg-dir').sync
const { isObject } = require('@mars-cli-dev/utils')
class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package 參數不可為空!')
    }
    if (!isObject(options)) {
      throw new Error('package 參數必須為 Object')
    }
    this.targetPath = options.targetPath
    this.packageName = options.packageName
    this.packageVersion = options.packageVersion
  }

  // 判斷當前 package 是否存在
  exists() {}

  // 安裝 package
  install() {}

  // 更新 package
  update() {}

  // 獲取入口文件的路徑
  getRootFile() {
    // 1. 取得 package.json 所在目錄
    const dir = pkgDir(this.targetPath)

    if (dir) {
      // 2. 讀取 package.json - require()
      const pkgFile = require(path.resolve(dir, 'package.json'))

      if (pkgFile && pkgFile.main) {
        // 3. 找到 main/lib - path
        return path.resolve(dir, pkgFile.main)
      }
    }
    // 4. 路徑的兼容(macOS / windows)

    return null
  }
}

module.exports = Package
