let fs = require('fs')
const { MongoClient } = require('mongodb')
const { findFiles, log2txt } = require('./utils/utils')

const url = 'mongodb://localhost:27017/'
const client = new MongoClient(url)

const lstFPaths = findFiles('../Bangumi-Subject/data')
let lstDocs = []
let doc = null

async function run(type) {
  await client.connect()
  const database = client.db('Bangumi')
  const collection = database.collection(`subject__type${type}`)

  for (let iFPath = 0; iFPath < lstFPaths.length; iFPath++) {
    const fPath = lstFPaths[iFPath]
    let data = fs.readFileSync(fPath).toString()
    try {
      try {
        doc = JSON.parse(data)
      } catch (error) {
        doc = JSON.parse(
          data.replace(/":"(.*?)"(,"|\})/g, (m, $1, $2) => {
            return `":"${$1.replace(/(?<!\\)"/g, '\\"')}"${$2}`
          })
        )
      }
      if (doc.type == type) lstDocs.push(doc)
    } catch (err) {
      console.log(err)
      log2txt('log/errlog_mon.txt', `    ${fPath}\n    ${err}\n`)
    }

    if (iFPath % 500 == 0 || iFPath == lstFPaths.length - 1) {
      console.log(`- read ${fPath} [${iFPath} / ${lstFPaths.length}]`)
      if (lstDocs.length) {
        let res = await collection.insertMany(lstDocs).catch((err) => {
          log2txt('log/errlog_sql.txt', `    ${fPath}\n    ${err}\n`)
        })
        console.log(`insertedCount: ${res?.insertedCount}`)
        lstDocs = []
      }
    }
  }
  console.log('done')
  await client.close()
}
run(2) // 5min
