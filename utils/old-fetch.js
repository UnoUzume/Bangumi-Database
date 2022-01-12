/*
 * @Author: czy0729
 * @Date: 2020-02-14 20:34:19
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-10-28 19:26:26
 */
const axios = require('axios')
const HTMLParser = require('./html-parser')

axios.defaults.timeout = 3000

const INIT_MONO = {
  name: '', // 日文名
  nameCn: '', // 中文名
  cover: '', // 封面
  info: '', // 简介
  detail: '', // 内容详情
  voices: [], // 最近演出角色
  works: [], // 最近参与
  jobs: [], // 出演
}

function removeCF(HTML = '') {
  return HTML.replace(
    /<script[^>]*>([\s\S](?!<script))*?<\/script>|<noscript[^>]*>([\s\S](?!<script))*?<\/noscript>|style="display:none;visibility:hidden;"/g,
    ''
  ).replace(/data-cfsrc/g, 'src')
}

function HTMLTrim(str = '') {
  if (typeof str !== 'string') {
    return str
  }
  return (
    removeCF(str)
      // .replace(/<!--.*?-->/gi, '')
      // .replace(/\/\*.*?\*\//gi, '')
      // .replace(/[ ]+</gi, '<')
      .replace(/\n+|\s\s\s*|\t/g, '')
      .replace(/"class="/g, '" class="')

      // 补充 190829
      .replace(/> </g, '><')
  )
}

function HTMLToTree(html, cmd = true) {
  const tree = {
    tag: 'root',
    attrs: {},
    text: [],
    children: [],
  }
  if (cmd) {
    tree.cmd = 'root'
  }
  let ref = tree

  HTMLParser.HTMLParser(html, {
    start: (tag, attrs, unary) => {
      const attrsMap = {}
      attrs.forEach(({ name, value, escaped }) => {
        // @issue 190507
        // 带有cookie的请求经过cloudflare返回的html部分attr的属性被加上了data-cf前缀??? 醉了
        const _name = name.replace('data-cf', '')
        return (attrsMap[_name] = escaped || value)
      })
      const item = {
        tag,
        attrs: attrsMap,
      }
      if (cmd) {
        item.cmd = `${ref.cmd} > ${tag}`
      }
      if (!unary) {
        item.parent = ref
        item.text = []
        item.children = []
      }
      ref.children.push(item)

      if (!unary) {
        ref = item
      }
    },
    chars: (text) => {
      ref.text.push(text)
    },
    end: () => {
      const _ref = ref.parent
      delete ref.parent
      ref = _ref
    },
  })

  return tree
}

function findTreeNode(children, cmd = '', defaultValue) {
  if (!cmd) {
    return children
  }

  const split = ' > '
  const tags = cmd.split(split)
  const tag = tags.shift()
  const find = children.filter((item) => {
    let temp = tag.split('|')
    const _tag = temp[0]
    const attr = temp[1] || ''

    if (attr) {
      const attrs = attr.split('&')
      let match = true
      attrs.forEach((attr) => {
        if (attr.indexOf('~') !== -1) {
          // ~
          temp = attr.split('~')
          const _attr = temp[0]
          const _value = temp[1]
          if (_value) {
            match = match && item.tag === _tag && item.attrs[_attr] && item.attrs[_attr].indexOf(_value) !== -1
          } else if (_attr) {
            match = match && item.tag === _tag && item.attrs[_attr] !== undefined
          }
        } else {
          // =
          temp = attr.split('=')
          const _attr = temp[0]
          const _value = temp[1]
          if (_value) {
            match = match && item.tag === _tag && item.attrs[_attr] == _value
          } else if (_attr) {
            if (_attr === 'text') {
              match = match && item.tag === _tag && item.text.length !== 0
            } else {
              match = match && item.tag === _tag && item.attrs[_attr] !== undefined
            }
          }
        }
      })
      return match
    }
    return item.tag === _tag
  })
  if (!find.length) {
    return undefined || defaultValue
  }
  if (!tags.length) {
    return find
  }

  const _find = []
  find.forEach((item) => {
    _find.push(...(findTreeNode(item.children, tags.join(split)) || []))
  })
  if (!_find.length) {
    return undefined || defaultValue
  }
  return _find
}

function findTree(tree, cmd = '', defaultValue) {
  return findTreeNode(tree.children, cmd, defaultValue)
}

function HTMLDecode(str = '') {
  if (str.length === 0) {
    return ''
  }
  return (
    str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      // eslint-disable-next-line quotes
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
  )
}

module.exports = {
  HTMLTrim,
  HTMLDecode,
  HTMLToTree,
  findTree,
}
