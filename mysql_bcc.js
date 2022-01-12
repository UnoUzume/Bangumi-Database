const fs = require('fs')
const path = require('path')
const mysql = require('mysql')
const { walkSync, query } = require('./utils/utils')

const pool = mysql.createPool({
  host: 'localhost',
  user: 'dutbit',
  password: '12345678',
  database: 'anime',
})

async function run() {
  await walkSync('bcc', async function (filePath, stat) {
    console.log(filePath)
    const data = fs.readFileSync(filePath)
    try {
      const doc = JSON.parse(data)
      // let sql = 'INSERT IGNORE INTO `character` VALUES(?,?,?,?,?,?)'
      // let sqlParams = [
      //   path.basename(filePath).split('.')[0],
      //   doc.name,
      //   doc.nameCn,
      //   doc.cover,
      //   doc.info,
      //   doc.detail,
      // ]

      if (doc.crts) {
        for (let i = 0; i < doc.crts.length; i++) {
          const crt = doc.crts[i]
          if (crt.crt_id && crt.persons) {
            if (crt.persons.length == 0) {
              let sql = 'INSERT IGNORE INTO `bgm-crt-cv` VALUES(0,?,?,?)'
              let sqlParams = [doc.monoId, crt.crt_id, 0]
              await query(sql, sqlParams)
            } else {
              for (let j = 0; j < crt.persons.length; j++) {
                let sql = 'INSERT IGNORE INTO `bgm-crt-cv` VALUES(0,?,?,?)'
                let person_id = crt.persons[j]
                let sqlParams = [doc.monoId, crt.crt_id, person_id]
                await query(pool, sql, sqlParams)
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(err)
      var fd = fs.openSync('errlog.txt', 'a')
      fs.writeSync(fd, filePath + '\n')
      fs.writeSync(fd, err + '\n')
      fs.closeSync(fd)
    }
    console.log('ok')
  })
  console.log('done')
}
run()
