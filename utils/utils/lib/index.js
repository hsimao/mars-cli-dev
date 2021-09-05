'use strict'

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]'
}

// 封裝 spawn 兼容作業系統
function exec(command, args, options = {}) {
  const isWin32 = process.platform === 'win32'

  // window 系統
  // cp.spawn('cmd', ['/c', 'node', '-e', code])
  const cmd = isWin32 ? 'cmd' : command
  const cmdArgs = isWin32 ? ['/c'].concat(command, args) : args

  return require('child_process').spawn(cmd, cmdArgs, options)
}

function execAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options)
    p.on('error', (e) => reject(e))
    p.on('exit', (c) => resolve(c))
  })
}

module.exports = {
  isObject,
  isArray,
  execAsync,
  exec,
}
