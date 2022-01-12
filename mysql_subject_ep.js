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
  await walkSync('../Bangumi-Subject/data', async function (filePath, stat) {
    console.log(filePath)
    let data = fs.readFileSync(filePath)
    try {
      let doc
      try {
        doc = JSON.parse(data)
      } catch (error) {
        let data_s = data.toString()
        let correct = data_s.match(/"name":"(.*)","image"/)[1].replace(/"/g, '\\"')
        data_s = data_s.replace(/"name":".*","image"/, '"name":"' + correct + '","image"')
        doc = JSON.parse(data_s)
      }
      if (doc.type == 2) {
        // let sql =
        // 'INSERT IGNORE INTO `bangumi_ep` VALUES(?,?,?,?,?,?,?,?)'
        // let sqlParams = [
        //   doc.id,
        //   doc.name,
        //   '',
        //   doc.image,
        //   doc.rating ? doc.rating.total : '',
        //   doc.rating ? doc.rating.score : '',
        //   doc.info,
        //   doc.summary,
        // ]
        for (let index = 0; index < doc.eps.length; index++) {
          const ep = doc.eps[index]
          let sql = 'INSERT IGNORE INTO `bangumi_ep` VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
          let match = ep.duration.match(/(\d{2}):(\d{2}):(\d{2})/)
          let match2 = ep.duration.match(/(\d+)m/)
          let sqlParams = [
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
          ]
          await query(pool, sql, sqlParams)
        }
        console.log('ok')
      }
    } catch (err) {
      console.log(err)
      let fd = fs.openSync('log/errlog.txt', 'a')
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
