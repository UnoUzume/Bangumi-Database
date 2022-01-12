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

function walkSync(currentDirPath, callback) {
  let list = fs.readdirSync(currentDirPath)
  for (let index = 0; index < list.length; index++) {
    const name = list[index]
    let filePath = path.join(currentDirPath, name)
    let stat = fs.statSync(filePath)
    if (stat.isFile()) {
      callback(filePath, stat)
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback)
    }
  }
}

const crt_ids = []
// walkSync('bgmP_crt', function (filePath, stat) {
//   console.log(filePath)
//   const data = fs.readFileSync(filePath)
//   try {
//     const doc = JSON.parse(data)
//     for (let index = 0; index < doc.crts.length; index++) {
//       const crt = doc.crts[index]
//       crt_ids.push(crt.crt_id)
//     }
//   } catch (err) {
//     var fd = fs.openSync('errlog.txt', 'a')
//     fs.writeSync(fd, filePath + '\n')
//     fs.writeSync(fd, err + '\n')
//     fs.closeSync(fd)
//     console.log(err)
//   }
//   console.log('ok')
// })
walkSync('../Bangumi-Mono/data', function (filePath, stat) {
  crt_ids.push(path.basename(filePath).split('.')[0])
})

const uniqueIds = Array.from(new Set(crt_ids))

function fetchMono(id, index) {
  return new Promise(async (resolve, reject) => {
    const filePath = `./crt/${Math.floor(id / 100)}/${id}.json`
    if (!rewrite && fs.existsSync(filePath)) {
      console.log(`- skip ${id}.json [${index} / ${uniqueIds.length}]`)
      return resolve(true)
    }

    const data = await fetch_crt(id)
    const dirPath = path.dirname(filePath)
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath)

    console.log(`- writing ${id}.json [${index} / ${uniqueIds.length}]`, data.nameCn || data.name)
    fs.writeFileSync(filePath, utils.safeStringify(data))
    return resolve(true)
  })
}
const fetchs = uniqueIds.map((id, index) => () => fetchMono(id, index))
utils.queue(fetchs, 6) // 150min

async function fetch_crt(monoId, headers) {
  try {
    let HTML, matchHTML, node

    // 角色信息
    const mono = {
      name: '', // 日文名
      nameCN: '', // 中文名
      cover: '', // 封面
      info: '', // 简介
      detail: '', // 内容详情
      jobs: [], // 出演
    }

    const { data: raw } = await axios({ url: `https://bgm.tv/character/${monoId}`, headers })
    if ((HTML = HTMLTrim(raw))) {
      // 标题
      matchHTML = HTML.match(/<h1 class="nameSingle">(.+?)<\/h1>/)
      if (matchHTML) {
        node = findTree(HTMLToTree(matchHTML[1]), 'a|text&title')
        mono.name = node?.[0].text[0] ?? ''
        mono.nameCN = node?.[0].attrs.title ?? ''
      }

      // 封面
      matchHTML = HTML.match(/<img src="(.+?)" class="cover"\s*\/>/)
      if (matchHTML) mono.cover = String(matchHTML[1]).split('?')[0]

      // 各种详细
      matchHTML = HTML.match(/<ul id="infobox">(.+?)<\/ul>/)
      if (matchHTML)
        mono.info = String(matchHTML[1])
          .replace(/\n/g, '')
          .replace(/ class="(.+?)"/g, '')
          .replace(/ title="(.+?)"/g, '')
          .replace(/>( +)</g, '><')
          .trim()

      // 详情
      matchHTML = HTML.match(/<div class="detail">(.+?)<\/div>/)
      if (matchHTML) mono.detail = matchHTML[1]

      // 出演
      matchHTML = HTML.match(
        /<h2 class="subtitle">出演<\/h2><ul class="browserList">(.+?)<\/ul><div class="section_line clear">/
      )
      if (matchHTML)
        HTMLToTree(matchHTML[1]).children.forEach((item) => {
          node = findTree(item, 'div > div > h3 > a')
          const href = node?.[0].attrs.href ?? ''
          const name = HTMLDecode(node?.[0].text[0] ?? '')

          node = findTree(item, 'div > div > small')
          const nameCN = node?.[0].text[0] ?? ''

          node = findTree(item, 'div > a > img')
          const cover = String(node?.[0].attrs.src ?? '').split('?')[0]

          node = findTree(item, 'div > div > span')
          const staff = node?.[0].text[0] ?? ''

          const ulChildren = findTree(item, 'ul')?.[0].children ?? []
          let casts = []
          for (let index = 0; index < ulChildren.length; index++) {
            const li = ulChildren[index]

            node = findTree(li, 'a')
            const cast = node?.[0].attrs.title ?? ''
            const castHref = node?.[0].attrs.href ?? ''

            node = findTree(li, 'div > small')
            const castTag = node?.[0].text[0] ?? ''
            node = findTree(li, 'a > img')
            const castCover = String(node?.[0].attrs.src ?? '').split('?')[0]

            casts.push({ cast, castHref, castTag, castCover })
          }

          node = findTree(item, 'div > div > h3 > span')
          const type = parseInt(node?.[0].attrs.class.replace(/ico_subject_type subject_type_| ll/g, '') ?? '0')

          mono.jobs.push({ href, name, nameCN, cover, staff, casts, type })
        })
    }
    return Promise.resolve(mono)
  } catch (error) {
    console.log(error)
    const msg = '\x1b[40m \x1b[31m[RETRY] ' + monoId + ' \x1b[0m'
    console.log(msg)
    return fetch_crt(monoId, headers)
  }
}
