'use strict'

const path = require('path')
const pathExists = require('path-exists').sync
const fsExtra = require('fs-extra')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const formatPath = require('@mars-cli-dev/format-path')
const { isObject } = require('@mars-cli-dev/utils')
const { getNpmLatestVersion } = require('@mars-cli-dev/get-npm-info')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package 參數不可為空!')
    }
    if (!isObject(options)) {
      throw new Error('package 參數必須為 Object')
    }
    this.targetPath = options.targetPath
    this.storeDir = options.storeDir
    this.packageName = options.packageName
    this.packageVersion = options.packageVersion
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  get cacheFilePath() {
    return this.getCacheFilePathByVersion(this.packageVersion)
  }

  // _@mars-cli-dev__init@1.0.0@mars-cli-dev/init
  getCacheFilePathByVersion(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    )
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fsExtra.mkdirpSync(this.storeDir)
    }

    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
  }

  // 判斷當前 package 是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare()
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.targetPath)
    }
  }

  // 安裝 package
  async install() {
    await this.prepare()

    npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: 'https://registry.npmjs.org',
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    })
  }

  // 更新 package
  async update() {
    await this.prepare()

    // 1. 取得最新版本號
    const latestVersion = await getNpmLatestVersion(this.packageName)

    // 2. 查詢最新版本號的緩存 node_modules 路徑使否存在
    const latestFilePath = this.getCacheFilePathByVersion(latestVersion)

    // 3. 不存在則直接安裝最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: 'https://registry.npmjs.org',
        pkgs: [{ name: this.packageName, version: latestVersion }],
      })
      this.packageVersion = latestVersion
    }
  }

  // 獲取入口文件的路徑
  getRootFilePath() {
    const targetPath = this.storeDir ? this.cacheFilePath : this.targetPath

    // 1. 取得 package.json 所在目錄
    const dir = pkgDir(targetPath)

    if (dir) {
      // 2. 讀取 package.json - require()
      const pkgFile = require(path.resolve(dir, 'package.json'))

      if (pkgFile && pkgFile.main) {
        // 3. 找到 main/lib, 並透過 formatPath 兼容 macOS / windows 路徑s
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }

    return null
  }
}

module.exports = Package
