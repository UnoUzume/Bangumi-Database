const cheerioRN = require('cheerio-without-node-native')
const path = require('path')
const fs = require('fs')

function safeObject(object = {}) {
  Object.keys(object).forEach((key) => {
    if (object[key] === undefined) {
      // eslint-disable-next-line no-param-reassign
      object[key] = ''
    }
  })
  return object
}

function getCoverMedium(src = '', mini = false) {
  if (typeof src !== 'string' || src === '') {
    return ''
  }

  // 角色图片不要处理
  if (src.includes('/crt/')) {
    return src
  }

  // 用户头像和小组图标没有/c/类型
  if (mini || src.includes('/user/') || src.includes('/icon/')) {
    return src.replace(/\/g\/|\/s\/|\/c\/|\/l\//, '/m/')
  }
  return src.replace(/\/g\/|\/s\/|\/m\/|\/l\//, '/c/')
}

function removeCF(HTML = '') {
  return HTML.replace(
    /<script[^>]*>([\s\S](?!<script))*?<\/script>|<noscript[^>]*>([\s\S](?!<script))*?<\/noscript>|style="display:none;visibility:hidden;"/g,
    ''
  ).replace(/data-cfsrc/g, 'src')
}

function cheerio(target) {
  if (typeof target === 'string') {
    return cheerioRN.load(removeCF(target))
  }
  return cheerioRN(target)
}

async function queue(fetchs, num = 2) {
  if (!fetchs.length) {
    return false
  }

  await Promise.all(
    new Array(num).fill(0).map(async () => {
      while (fetchs.length) {
        // eslint-disable-next-line no-await-in-loop
        await fetchs.shift()()
      }
    })
  )
  return true
}

function safeStringify(data) {
  return JSON.stringify(data).replace(/:null/g, ':""')
}

function getTimestamp() {
  return Math.floor(new Date().valueOf() / 1000)
}

function smallImage(item, type = 'medium') {
  return ((item.images && item.images[type]) || '')
    .replace('http://lain.bgm.tv/', '//lain.bgm.tv/')
    .replace('https://lain.bgm.tv/', '//lain.bgm.tv/')
    .split('?')[0]
}

// async function walkSync(curDPath, callback) {
//   fs.readdirSync(curDPath).forEach((item) => {
//     const aPath = path.join(curDPath, item) //A Path, DirPath, FilePath
//     const stat = fs.statSync(aPath)
//     if (stat.isDirectory()) await walkSync(aPath, callback)
//     else if (stat.isFile()) await callback(aPath, stat)
//   })
// }

function findFiles(curDpath) {
  //inner function
  function ifunc_find(dPath) {
    fs.readdirSync(dPath).forEach((item) => {
      const aPath = path.join(dPath, item)
      const stat = fs.statSync(aPath)
      if (stat.isDirectory()) ifunc_find(aPath)
      else if (stat.isFile()) filePaths.push(aPath)
    })
  }
  const filePaths = []
  ifunc_find(curDpath)
  return filePaths
}

function query(pool, sql, values) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        reject(err)
      } else {
        connection.query(sql, values, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
          connection.release()
        })
      }
    })
  })
}
module.exports = {
  safeObject,
  getCoverMedium,
  removeCF,
  cheerio,
  queue,
  safeStringify,
  getTimestamp,
  smallImage,
  // walkSync,
  findFiles,
  query,
}
