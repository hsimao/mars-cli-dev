const request = require('@mars-cli-dev/request')

module.exports = function () {
  return request({ url: '/project/template' })
}
