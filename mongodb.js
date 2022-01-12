const { MongoClient } = require('mongodb')
let fs = require('fs')
let url = 'mongodb://localhost:27017/'

//30min
async function walkSync(currentDirPath, callback) {
  let fs = require('fs'),
    path = require('path')
  let list = fs.readdirSync(currentDirPath)
  for (let index = 0; index < list.length; index++) {
    const name = list[index]
    let filePath = path.join(currentDirPath, name)
    let stat = fs.statSync(filePath)
    if (stat.isFile()) {
      await callback(filePath, stat)
    } else if (stat.isDirectory()) {
      await walkSync(filePath, callback)
    }
  }
}

const client = new MongoClient(url)
async function run() {
  await client.connect()
  await walkSync('data', async function (filePath, stat) {
    const database = client.db('Bangumi')
    console.log(filePath)
    const data = fs.readFileSync(filePath)
    try {
      const doc = JSON.parse(data)
      if (!doc.type) {
        var fd = fs.openSync('errlog.txt', 'a')
        fs.writeSync(fd, filePath + '\n')
        fs.writeSync(fd, 'doc.type undefined\n')
        fs.closeSync(fd)
      }
      const collection = database.collection('subject__type' + doc.type)
      await collection.insertOne(doc)
    } catch (err) {
      var fd = fs.openSync('errlog.txt', 'a')
      fs.writeSync(fd, filePath + '\n')
      fs.writeSync(fd, err + '\n')
      fs.closeSync(fd)
      console.log(err)
    }
    console.log('ok')
  })
  await client.close()
  console.log('done')
}
run()
