const fs = require('fs')
const mysql = require('mysql')
const { findFiles, conQuerySync, log2txt } = require('./utils/utils')

const con = mysql.createConnection({
  host: 'localhost',
  user: 'dutbit',
  password: '12345678',
  database: 'anime',
})
let lstBgmParams = []
let lstEpParams = []
let doc = null
let sql = ''

async function run() {
  const lstFPaths = findFiles('../Bangumi-Subject/data')
  con.connect()
  for (let i = 0; i < lstFPaths.length; i++) {
    const fPath = lstFPaths[i]
    // console.log(`- read ${fPath}.json [${i} / ${lstFPaths.length}]`)
    let data = fs.readFileSync(fPath).toString()
    try {
      try {
        doc = JSON.parse(data)
      } catch (error) {
        doc = JSON.parse(
          data.replace(/":"(.*?)"(,"|\})/g, (m, $1, $2) => {
            // log2txt('log/errlog.txt', `    replace:\n    ${$1}\n`)
            return `":"${$1.replace(/(?<!\\)"/g, '\\"')}"${$2}`
          })
        )
      }
      if (doc.type == 2) {
        lstBgmParams.push([
          doc.id,
          doc.name,
          '',
          doc.image,
          '',
          '',
          doc.rating?.total ?? '',
          doc.rating?.score ?? '',
          doc.info,
          doc.summary,
        ])
        for (let index = 0; index < doc.eps?.length ?? 0; index++) {
          const ep = doc.eps[index]
          let match = ep.duration.match(/(\d{2}):(\d{2}):(\d{2})/)
          let match2 = ep.duration.match(/(\d+)m/)
          lstEpParams.push([
            ep.id,
            ep.type,
            ep.sort,
            ep.name,
            ep.name_cn,
            ep.duration,
            match && match[1] ? match[1] : '',
            match && match[2] ? match[2] : match2 && match2[1] ? match2[1] : '',
            match && match[3] ? match[3] : '',
            ep.airdate,
            ep.desc,
            doc.id,
          ])
        }
      }
      if (i % 100 == 0 || i == lstFPaths.length - 1) {
        console.log(`- read ${fPath}.json [${i} / ${lstFPaths.length}]`)
        if (lstBgmParams.length) {
          sql = 'INSERT IGNORE INTO `bangumi__type2` VALUES ?'
          let rows = await conQuerySync(con, sql, [lstBgmParams]).catch((err) => {
            log2txt('log/errlog_sql.txt', `    ${fPath}\n    ${err}\n`)
          })
          console.log(rows)
          console.log(`insert bgm: ${lstBgmParams.length}`)
          lstBgmParams = []
        }
        if (lstEpParams.length) {
          sql = 'INSERT IGNORE INTO `bangumi_ep` VALUES ?'
          let rows = await conQuerySync(con, sql, [lstEpParams]).catch((err) => {
            log2txt('log/errlog_sql.txt', `    ${fPath}\n    ${err}\n`)
          })
          console.log(rows)
          console.log(`insert ep:  ${lstEpParams.length}`)
          lstEpParams = []
        }
      }
    } catch (err) {
      log2txt('log/errlog.txt', `    ${fPath}\n    ${err}\n`)
    }
  }
  console.log('done')
  con.end()
}
run() // 20min
