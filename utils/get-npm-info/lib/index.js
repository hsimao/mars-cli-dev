'use strict'

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

function getNpmInfo(npmName, registry) {
  if (!npmName) null
  const registryUrl = registry || 'https://registry.npmjs.org'
  const npmInfoUrl = urlJoin(registryUrl, npmName)

  return axios
    .get(npmInfoUrl)
    .then((res) => (res.status === 200 ? res.data : null))
    .catch((err) => Promise.reject(err))
}

async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  return data ? Object.keys(data.versions) : []
}

// 取得大於 baseVersion 的所有版本號, 並依據版本號排序, 最新排在前面
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => semver.gt(b, a))
}

// 取得最新版本號
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersions = getSemverVersions(baseVersion, versions)
  if (newVersions && newVersions.length > 0) {
    return newVersions[0]
  }
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
}
