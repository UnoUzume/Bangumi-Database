/*
 * @Author: czy0729
 * @Date: 2020-01-14 19:30:54
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-02-14 20:45:57
 */
const utils = require('./utils')
const match = require('./match')
const decoder = require('./decoder')

const HOST = 'https://bgm.tv'

function cheerioMono(HTML) {
  const $ = utils.cheerio(HTML)
}

function cheerioIds(HTML) {
  const $ = utils.cheerio(HTML)
  const ids =
    $('ul.browserFull > li')
      .map((index, element) => {
        const $li = utils.cheerio(element)
        return parseInt($li.attr('id').replace('item_', ''))
      })
      .get() || []
  return ids
}

module.exports = {
  cheerioMono,
  cheerioIds
}
