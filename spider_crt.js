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

// const lstFPaths = utils.findFiles('../Bangumi-Mono/data')
// const lstCrtIDs = lstFPaths.map((fPath) => {
//   return parseInt(path.basename(fPath, '.json'))
// })
// const lstIDs_uni = Array.from(new Set(lstCrtIDs))
// fs.writeFileSync('lstCrtIDs.json', JSON.stringify(lstIDs_uni.sort((a, b) => a - b)))

const lstIDs_uni = JSON.parse(fs.readFileSync('lstCrtIDs.json'))

function run(id, index) {
  return new Promise(async (resolve, reject) => {
    const fPath = `./crt/${Math.floor(id / 100)}/${id}.json`
    if (!rewrite && fs.existsSync(fPath)) {
      console.log(`- skip ${id}.json [${index} / ${lstIDs_uni.length}]`)
      return resolve(true)
    }

    const data = await fetchCrt(id)
    const dPath = path.dirname(fPath)
    if (!fs.existsSync(dPath)) fs.mkdirSync(dPath)

    console.log(`- writing ${id}.json [${index} / ${lstIDs_uni.length}]`, data.nameCn || data.name)
    fs.writeFileSync(fPath, utils.safeStringify(data))
    return resolve(true)
  })
}
const fetchs = lstIDs_uni.map((id, index) => () => run(id, index))
utils.queue(fetchs, 6) // 150min

async function fetchCrt(crtID, headers) {
  try {
    let HTML, matchHTML, node

    // 角色信息
    const crt = {
      name: '', // 日文名
      nameCN: '', // 中文名
      cover: '', // 封面
      info: '', // 简介
      detail: '', // 内容详情
      jobs: [], // 出演
    }

    const { data: raw } = await axios({ url: `https://bgm.tv/character/${crtID}`, headers })
    if ((HTML = HTMLTrim(raw))) {
      // 标题
      matchHTML = HTML.match(/<h1 class="nameSingle">(.+?)<\/h1>/)
      if (matchHTML) {
        node = findTree(HTMLToTree(matchHTML[1]), 'a|text&title')
        crt.name = node?.[0].text[0] ?? ''
        crt.nameCN = node?.[0].attrs.title ?? ''
      }

      // 封面
      matchHTML = HTML.match(/<img src="(.+?)" class="cover"\s*\/>/)
      if (matchHTML) crt.cover = String(matchHTML[1]).split('?')[0]

      // 各种详细
      matchHTML = HTML.match(/<ul id="infobox">(.+?)<\/ul>/)
      if (matchHTML)
        crt.info = String(matchHTML[1])
          .replace(/\n/g, '')
          .replace(/ class="(.+?)"/g, '')
          .replace(/ title="(.+?)"/g, '')
          .replace(/>( +)</g, '><')
          .trim()

      // 详情
      matchHTML = HTML.match(/<div class="detail">(.+?)<\/div>/)
      if (matchHTML) crt.detail = matchHTML[1]

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

          crt.jobs.push({ href, name, nameCN, cover, staff, casts, type })
        })
    }
    return Promise.resolve(crt)
  } catch (error) {
    console.log(error)
    const msg = '\x1b[40m \x1b[31m[RETRY] ' + crtID + ' \x1b[0m'
    console.log(msg)
    return fetchCrt(crtID, headers)
  }
}
