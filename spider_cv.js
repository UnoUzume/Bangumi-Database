const fs = require('fs')
const path = require('path')
const axios = require('axios')
const utils = require('./utils/utils')
const { HTMLTrim, HTMLDecode, HTMLToTree, findTree } = require('./utils/old-fetch')

const lstFPaths = utils.findFiles('./crt')

const lstIDs = []
lstFPaths.forEach((fPath) => {
  const { jobs } = JSON.parse(fs.readFileSync(fPath))
  jobs.forEach((job) => {
    for (let i = 0; i < job.casts.length; i++) {
      const castHref = /** @type {String} */ (job.casts[i].castHref)
      if (castHref.includes('/person/')) lstIDs.push(castHref.replace('/person/', ''))
    }
  })
})
const lstIDs_uni = Array.from(new Set(lstIDs))
// const lstIDs_uni = [8138]

function run(id, index) {
  return new Promise(async (resolve, reject) => {
    const fPath = `./cv/${Math.floor(id / 100)}/${id}.json`
    if (fs.existsSync(fPath)) {
      console.log(`- skip ${id}.json [${index} / ${lstIDs_uni.length}]`)
      return resolve(true)
    }

    const data = await fetchCV(id)
    const dPath = path.dirname(fPath)
    if (!fs.existsSync(dPath)) fs.mkdirSync(dPath)

    console.log(`- writing ${id}.json [${index} / ${lstIDs_uni.length}]`)
    fs.writeFileSync(fPath, utils.safeStringify(data, data.nameCN || data.name))
    return resolve(true)
  })
}
const fetchs = lstIDs_uni.map((id, index) => () => run(id, index))
utils.queue(fetchs, 6) // 40min

async function fetchCV(cvID, headers) {
  try {
    let HTML, matchHTML, node

    // 人物信息
    const cv = {
      name: '', // 日文名
      nameCN: '', // 中文名
      cover: '', // 封面
      info: '', // 简介
      detail: '', // 内容详情
      voices: [], // 最近演出角色
    }

    const { data: raw } = await axios({ url: `https://bgm.tv/person/${cvID}`, headers })
    if ((HTML = HTMLTrim(raw))) {
      // 标题
      matchHTML = HTML.match(/<h1 class="nameSingle">(.+?)<\/h1>/)
      if (matchHTML) {
        node = findTree(HTMLToTree(matchHTML[1]), 'a|text&title')
        cv.name = node?.[0].text[0] ?? ''
        cv.nameCN = node?.[0].attrs.title ?? ''
      }

      // 封面
      matchHTML = HTML.match(/<img src="(.+?)" class="cover"\s*\/>/)
      if (matchHTML) cv.cover = String(matchHTML[1]).split('?')[0]

      // 各种详细
      matchHTML = HTML.match(/<ul id="infobox">(.+?)<\/ul>/)
      if (matchHTML)
        cv.info = String(matchHTML[1])
          .replace(/\n/g, '')
          .replace(/ class="(.+?)"/g, '')
          .replace(/ title="(.+?)"/g, '')
          .replace(/>( +)</g, '><')
          .trim()

      // 详情
      matchHTML = HTML.match(/<div class="detail">(.+?)<\/div>/)
      if (matchHTML) cv.detail = matchHTML[1]
    }

    const { data: raw2 } = await axios({ url: `https://bgm.tv/person/${cvID}/works/voice`, headers })
    if ((HTML = HTMLTrim(raw2))) {
      // 角色
      matchHTML = HTML.match(/<div class="section"><ul class="browserList">(.+?)<\/ul><div class="clearit">/)
      if (matchHTML)
        HTMLToTree(matchHTML[1]).children.forEach((item) => {
          node = findTree(item, 'div > a|href&title')
          const href = HTMLDecode(node?.[0].attrs.href ?? '')
          const name = HTMLDecode(node?.[0].attrs.title ?? '')

          node = findTree(item, 'div > div > h3 > p')
          const nameCN = node?.[0].text[0] ?? ''

          node = findTree(item, 'div > a > img')
          const cover = String(node?.[0].attrs.src ?? '').split('?')[0]

          const ulChildren = findTree(item, 'ul')?.[0].children ?? []
          let subjects = []
          for (let index = 0; index < ulChildren.length; index++) {
            const li = ulChildren[index]

            node = findTree(li, 'div > h3 > a|text&href')
            const subjectHref = node?.[0].attrs.href ?? ''
            const subjectName = HTMLDecode(node?.[0].text[0] ?? '')

            node = findTree(li, 'div > small')
            const subjectnameCN = HTMLDecode(node?.[0].text[0] ?? '')

            node = findTree(li, 'div > span')
            const staff = node?.[0].text[0] ?? ''

            node = findTree(li, 'a > img')
            const subjectCover = String(node?.[0].attrs.src ?? '').split('?')[0]

            subjects.push({ subjectHref, subjectName, subjectnameCN, staff, subjectCover })
          }
          cv.voices.push({ href, name, nameCN, cover, subjects })
        })
    }
    return Promise.resolve(cv)
  } catch (error) {
    console.log(error)
    const msg = '\x1b[40m \x1b[31m[RETRY] ' + cvID + ' \x1b[0m'
    console.log(msg)
    return fetchCV(cvID, headers)
  }
}
