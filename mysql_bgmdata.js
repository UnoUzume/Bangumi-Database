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
  await walkSync('../bangumi-data/data/items', async function (filePath, stat) {
    console.log(filePath)
    let data = fs.readFileSync(filePath)
    try {
      let doc = JSON.parse(data)
      for (let index = 0; index < doc.length; index++) {
        const bgm = doc[index]
        let sql = 'UPDATE bangumi__type2 SET officialSite=?,`begin`=? WHERE bangumi_id=?'
        let bgm_id = 0
        for (let j = 0; j < bgm.sites.length; j++) {
          if (bgm.sites[j].site == 'bangumi') {
            bgm_id = bgm.sites[j].id
          }
        }
        let begin = bgm.begin.split('T')[0]
        let sqlParams = [bgm.officialSite, begin, bgm_id]
        await query(pool, sql, sqlParams)
      }
      console.log('ok')
    } catch (err) {
      console.log(err)
      let fd = fs.openSync('log\\errlog.txt', 'a')
      let date = new Date()
      fs.writeSync(fd, date.toLocaleString() + '\n')
      fs.writeSync(fd, '    ' + filePath + '\n')
      fs.writeSync(fd, '    ' + err + '\n')
      fs.closeSync(fd)
    }
  })
  console.log('done')
}
run()
