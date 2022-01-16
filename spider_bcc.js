const fs = require('fs')
const path = require('path')
const axios = require('axios')
const utils = require('./utils/utils')
const { HTMLTrim, HTMLDecode, HTMLToTree, findTree } = require('./utils/old-fetch')

const rewrite = false
const headers = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
  Cookie:
    'chii_cookietime=2592000; chii_theme_choose=1; prg_list_mode=full; chii_theme=dark; __utmz=1.1612160564.2339.91.utmcsr=tongji.baidu.com|utmccn=(referral)|utmcmd=referral|utmcct=/; chii_auth=P%2BIXbnLOd7rB0%2B%2FMvAwZNE92bKWF2dkFHfuR5GjFuwX9lmP694IjhnU%2BtGVRkM7FJfPK%2BagBaZCoUtvHnZzSzua%2BRWe42vW2upi9; prg_display_mode=normal; __utmc=1; chii_sid=4ilz40; __utma=1.7292625.1567003648.1613871737.1613874216.2408; __utmt=1; __utmb=1.1.10.1613874216',
}

const lstIDs = [
  ...JSON.parse(fs.readFileSync('../Bangumi-Subject/ids/anime-2021.json')),
  ...JSON.parse(fs.readFileSync('../Bangumi-Subject/ids/anime-2020.json')),
  ...JSON.parse(fs.readFileSync('../Bangumi-Subject/ids/anime-rank.json')),
  ...JSON.parse(fs.readFileSync('../Bangumi-Subject/ids/anime-bangumi-data.json')),
]

const lstIDs_uni = Array.from(new Set(lstIDs))
// const lstIDs_uni = [252782]

// const raw = fs.readFileSync('bcc_lost.txt').toString()
// const lstIDs_uni = raw.match(/\d+\.json/g).map((value) => {
//   return value.replace('.json', '')
// })

function run(id, index) {
  return new Promise(async (resolve, reject) => {
    const fPath = `bcc/${Math.floor(id / 100)}/${id}.json`
    if (!rewrite && fs.existsSync(fPath)) {
      console.log(`- skip ${id}.json [${index} / ${lstIDs_uni.length}]`)
      return resolve(true)
    }

    const data = await fetchBCC(id)
    const dPath = path.dirname(fPath)
    if (!fs.existsSync(dPath)) fs.mkdirSync(dPath)

    console.log(`- writing ${id}.json [${index} / ${lstIDs_uni.length}]`)
    fs.writeFileSync(fPath, utils.safeStringify(data))
    return resolve(true)
  })
}
const fetchs = lstIDs_uni.map((id, index) => () => run(id, index))
utils.queue(fetchs, 6) // 35min

async function fetchBCC(subjectID, headers) {
  try {
    let HTML, matchHTML, node

    const subject = {
      subjectID: subjectID,
      crts: [],
    }

    const { data: raw } = await axios({ url: `https://bgm.tv/subject/${subjectID}/characters`, headers })
    if ((HTML = HTMLTrim(raw))) {
      matchHTML = HTML.match(
        /<div id="columnInSubjectA" class="column">(.+?)<\/div><div id="columnInSubjectB" class="column">/
      )
      if (matchHTML) {
        const elems_div = findTree(HTMLToTree(matchHTML[1]), 'div') ?? []
        elems_div.forEach((item) => {
          let crt = { crtID: 0, casts: [] }
          node = findTree(item, 'div > h2 > a|href')
          crt.crtID = node?.[0].attrs.href.replace('/character/', '') ?? 0

          const elems_a = findTree(item, 'div > div > a|href') ?? []
          for (let index = 0; index < elems_a.length; index++) {
            const elem_a = elems_a[index]
            crt.casts.push(elem_a.attrs.href.replace('/person/', ''))
          }

          subject.crts.push(crt)
        })
      }
    }
    return Promise.resolve(subject)
  } catch (error) {
    console.log(error)
    console.log('\x1b[40m \x1b[31m[RETRY] ' + subjectID + ' \x1b[0m')
    return fetchBCC(subjectID, headers)
  }
}
