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
  let data = fs.readFileSync('../Bangumi-Subject/cn/test.json')
  try {
    let doc = JSON.parse(data)
    for (const id in doc) {
      if (Object.hasOwnProperty.call(doc, id)) {
        let sql = 'UPDATE bangumi__type2 SET name_cn=? WHERE bangumi_id=?'
        let sqlParams = [doc[id], id]
        let result = await query(pool, sql, sqlParams)
        console.log(id, doc[id], result.affectedRows)
      }
    }
  } catch (err) {
    console.log(err)
    let fd = fs.openSync('log\\errlog.txt', 'a')
    let date = new Date()
    fs.writeSync(fd, date.toLocaleString() + '\n')
    fs.writeSync(fd, '    ' + filePath + '\n')
    fs.writeSync(fd, '    ' + err + '\n')
    fs.closeSync(fd)
  }
  console.log('done')
}
run().catch(() => {})
