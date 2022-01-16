const fs = require('fs')
const mysql = require('mysql')
const { findFiles, conQuerySync, log2txt } = require('./utils/utils')

const con = mysql.createConnection({
  host: 'localhost',
  user: 'dutbit',
  password: '12345678',
  database: 'anime',
})

async function run() {
  const lstFPaths = findFiles('../bangumi-data/data/items')
  con.connect()
  for (let i = 0; i < lstFPaths.length; i++) {
    const fPath = lstFPaths[i]
    console.log(`- read ${fPath}.json [${i} / ${lstFPaths.length}]`)
    let data = fs.readFileSync(fPath)
    try {
      let doc = JSON.parse(data)
      for (let j = 0; j < doc.length; j++) {
        const bgm = doc[j]
        let sql = 'UPDATE bangumi__type2 SET officialSite=?,`begin`=? WHERE bangumi_id=?'
        let bgm_id = 0
        for (let j = 0; j < bgm.sites.length; j++) if (bgm.sites[j].site == 'bangumi') bgm_id = bgm.sites[j].id
        let begin = bgm.begin.split('T')[0]

        let rows = await conQuerySync(con, sql, [bgm.officialSite, begin, bgm_id]).catch((err) => {
          log2txt('log/errlog_sql.txt', `    ${fPath}\n    ${err}\n`)
        })
        console.log(rows)
        console.log(`update data: ${j} / ${doc.length}`)
      }
    } catch (err) {
      console.log(err)
      log2txt('log/errlog.txt', `    ${fPath}\n    ${err}\n`)
    }
  }
  console.log('done')
  con.end()
}
run()
