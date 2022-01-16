const fs = require('fs')
const mysql = require('mysql')
const { conQuerySync, log2txt } = require('./utils/utils')

const con = mysql.createConnection({
  host: 'localhost',
  user: 'dutbit',
  password: '12345678',
  database: 'anime',
})

async function run() {
  let data = fs.readFileSync('../Bangumi-Subject/cn/data.json')
  con.connect()
  try {
    let doc = JSON.parse(data)
    for (const id in doc) {
      if (Object.hasOwnProperty.call(doc, id)) {
        let sql = 'UPDATE bangumi__type2 SET name_cn=? WHERE bangumi_id=?'
        let rows = await conQuerySync(con, sql, [doc[id], id]).catch((err) => {
          log2txt('log/errlog_sql.txt', `    ${err}\n`)
        })
        console.log(id, doc[id], rows.affectedRows)
      }
    }
  } catch (err) {
    console.log(err)
    log2txt('log/errlog.txt', `    updata cn:\n    ${err}\n`)
  }
  console.log('done')
  con.end()
}
run().catch(() => {})
