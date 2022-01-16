const fs = require('fs')
const path = require('path')
const mysql = require('mysql')
const { findFiles, conQuerySync, log2txt } = require('./utils/utils')

const con = mysql.createConnection({
  host: 'localhost',
  user: 'dutbit',
  password: '12345678',
  database: 'anime',
})
let lstParams = []

const indAction = 2
const lstActions = ['bcc', 'crt', 'cv']
const lstSqls = ['bgm-crt-cv', 'bgm_character', 'bgm_person__cv']
const sql = 'INSERT IGNORE INTO `' + lstSqls[indAction] + '` VALUES ?'

async function run() {
  const lstFPaths = findFiles(lstActions[indAction])
  con.connect()
  for (let iFPath = 0; iFPath < lstFPaths.length; iFPath++) {
    const fPath = lstFPaths[iFPath]
    // console.log(`- read ${fPath}.json [${iFPath} / ${lstFPaths.length}]`)
    const data = fs.readFileSync(fPath)
    try {
      const doc = JSON.parse(data)
      if (indAction != 0)
        lstParams.push([path.basename(fPath, '.json'), doc.name, doc.nameCN, doc.cover, doc.info, doc.detail])
      else
        for (let jCrt = 0; jCrt < doc.crts?.length ?? 0; jCrt++) {
          const crt = doc.crts[jCrt]
          for (let kPerson = 0; kPerson < (crt.casts.length || 1); kPerson++)
            lstParams.push([null, doc.subjectID, crt.crtID, crt.casts[kPerson] ?? 0])
        }
    } catch (err) {
      console.log(err)
      log2txt('log/errlog.txt', `    ${fPath}\n    ${err}\n`)
    }
    if (iFPath % 100 == 0 || iFPath == lstFPaths.length - 1) {
      console.log(`- read ${fPath} [${iFPath} / ${lstFPaths.length}]`)
      if (lstParams.length) {
        let rows = await conQuerySync(con, sql, [lstParams]).catch((err) => {
          log2txt('log/errlog_sql.txt', `    ${fPath}\n    ${err}\n`)
        })
        console.log(`affectedRows: ${rows?.affectedRows}`)
        lstParams = []
      }
    }
  }
  console.log('done')
  con.end()
}
run()
