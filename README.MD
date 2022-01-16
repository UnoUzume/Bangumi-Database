> 部分代码来源：https://github.com/czy0729/Bangumi-Mono

# 在本地建立一个 Bangumi 数据库

使用自己复刻的数据库可以查询得到如下问题的答案

- 所有名字中含有“昴”的角色
- 所有名字中含有“昴”的角色及其出场作品
- 所有名字中含有“昴”的角色及其声优
- “没有什么好怕的了”这一台词的出现过的剧集及时间

## 建立步骤

1. clone以下 Github 项目到同一文件夹中
   - Bangumi 条目静态数据快照：https://github.com/czy0729/Bangumi-Subject
   - *Bangumi 人物静态数据快照：https://github.com/czy0729/Bangumi-Mono*（非必需）
   - Bangumi Data：https://github.com/bangumi-data/bangumi-data
   - 字幕共享计划：https://github.com/foxofice/sub_share
   - 建立 Bangumi 数据库所需代码：https://github.com/Flinx-LY/Bangumi-Database
2. 使用`bangumi_db.sql`在MySQL数据库中建立数据表
3. 依次运行 Bangumi-Database 中的如下文件
   - spider_crt.js
   - spider_cv.js
   - spider_bcc.js
   - mysql_subject&ep.js
   - mysql_bgmdata.js
   - mysql_cn.js
   - mysql_bcc,crt,cv.js（需要更改`indAction`变量运行三次）
   - mysql_assFile.py
   - mysql_assDia.py
4. 删除`ass_dialogue`数据表的索引（加快导入速度）
5. 使用 Navicat 的导入功能导入`assDia`文件夹下csv文件至`ass_dialogue`数据表
6. 重建`ass_dialogue`数据表的索引（约需20分钟）

### 数据表行数统计

- `bangumi__type2`：18757
- `bangumi_ep`：217513
- `bgm_character`：38692
- `bgm_person__cv`：4428
- `bgm-crt-cv`：82524
- `ass_file`：59258
- `ass_dialogue`：27770149

## 部分代码介绍

### Bangumi-Subject

###### ids.js

爬取 2020 年的动画条目、所有类型的排行榜上的条目、bangumi-data 里面的所有条目的ID，保存于`ids`

###### spider.js

- 从`ids`读取作品ID列表
- 遍历作品ID列表，**使用API获取**及**爬取**对应作品资料保存于`data`

###### spider-by-index.js

- 指定开始ID和结束ID，生成作品ID列表
- 遍历作品ID列表，**使用API获取**及**爬取**对应作品资料保存于`data`

###### cn.js

遍历`data` 中作品资料文件，读取作品的中文名称保存于`cn`

###### rate.js

遍历`data` 中作品资料文件，读取作品的评分保存于`cn`

### Bangumi-Mono

###### spider.js

- 从`Bangumi-Subject/ids`读取作品ID列表
- 遍历作品ID列表，从`Bangumi-Subject/data` 读取对应作品资料文件中角色ID或人物ID列表
- 遍历角色ID或人物ID列表，爬取对应角色资料保存于`data`文件夹或人物资料保存于`person`文件夹

###### cv.js

- 遍历`data`中角色资料文件，从中读取声优ID列表
- 遍历声优ID列表，爬取对应声优资料保存于`person`文件夹

### Bangumi-Database

###### spider_crt.js

- 遍历`Bangumi-Mono/data`中角色资料文件，建立角色ID列表（已缓存，无需`Bangumi-Mono/data`）
- 遍历角色ID列表，爬取对应角色资料保存于`crt`文件夹

`Bangumi-Mono/spider.js`没有考虑到一个角色可能有多个声优为其配音，故在其代码基础上加以修改。

> 例子：https://bgm.tv/character/44166

###### spider_cv.js

- 遍历`crt`中角色资料文件，从中读取声优ID列表
- 遍历声优ID列表，爬取对应声优资料保存于`cv`文件夹

###### spider_bcc.js

- 从`Bangumi-Subject/ids`读取作品ID列表
- 遍历作品ID列表，爬取对应**作品ID-角色ID-声优ID**关系表保存于`bcc`文件夹

###### mysql_subject&ep.js

- 遍历`Bangumi-Subject/data`中作品资料文件
- 读取作品信息插入到`bangumi__type2`数据表
- 读取章节信息插入到`bangumi_ep`数据表

由于`Bangumi-Subject/data`中的部分json文件在保存时没有对英文引号进行处理，导致它们的json解析会失败，故使用如下代码在首次失败后进行正则替换再次解析。

```javascript
      try {
        doc = JSON.parse(data)
      } catch (error) {
        doc = JSON.parse(
          data.replace(/":"(.*?)"(,"|\})/g, (m, $1, $2) => {
            return `":"${$1.replace(/(?<!\\)"/g, '\\"')}"${$2}`
          })
        )
      }
```

###### mysql_bgmdata.js

- 遍历`bangumi-data/data/items`中每月作品资料文件
- 读取**官网**和**开始日期**更新`bangumi__type2`数据表

###### mysql_cn.js

- 读取`Bangumi-Subject/cn/data.json`中作品中文名称对照表
- 遍历中文名称对照表，读取**中文名称**更新`bangumi__type2`数据表

###### mysql_bcc,crt,cv.js

- 遍历`bcc`或`crt`或`cv`文件夹中文件
- 读取信息插入到`bgm-crt-cv`或`bgm_character`或`bgm_person__cv`数据表

本文件需要运行三次，请更改`indAction`变量分别完成以上三项工作

###### mysql_assFile.py

- 遍历`sub_share/subs_list/animation`中字幕文件
- 使用正则表达式从文件路径中获取字幕与作品的关联信息，插入到`ass_file`数据表

###### mysql_assDia.py

- 遍历`sub_share/subs_list/animation`中字幕文件
- 从`ass_file`数据表中查询ass文件ID
- 将台词的文本内容、时间连同ass文件ID保存至`assDia`文件夹下多个csv文件中，每个含100万行
- 此后使用 Navicat 的导入功能导入csv文件至`ass_dialogue`数据表

## 简要说明

在`Bangumi-Subject/data`文件夹下有30万条json格式的Bangumi条目数据。

如果使用MongoDB数据库，则执行如下这样的node.js代码即可直接导入json数据。

```javascript
const client = new MongoClient(url)
async function run() {
  await client.connect()
  await walkSync('data', async function (filePath, stat) {
    const database = client.db('Bangumi')
    const data = fs.readFileSync(filePath)
    try {
      const doc = JSON.parse(data)
      const collection = database.collection('subject__type' + doc.type)
      await collection.insertOne(doc)
    } catch (err) {
      console.log(err)
    }
  })
  await client.close()
}
run()
```

我使用了MySQL数据库，故需要设计表的结构以处理数组对象、子Object对象和一对多、多对多关系。

其关键是`bgm-crt-cv`关系表，因为**作品-角色**、**角色-声优**均为多对多关系。

而**作品-剧集**是一对多关系，只需在`bangumi_ep`剧集数据表设置一个`B_bangumi_id`字段指向作品数据表ID即可，`B_`前缀指明这是一对多关系。

注：`ass_file`数据表的`R_bangumi_id`字段中的`R_`前缀表明这一字段的数据可以查询获得，为简化操作而保存于此。

[未完，待补充]

## MySQL查询示例

### 按名称查询作品

```sql
SELECT bangumi_id, `name`, name_cn
FROM `bangumi__type2` WHERE
MATCH (`name`, `name_cn`) AGAINST ('回转企鹅罐')
```

| bangumi_id | name                                                     | name_cn               |
| ---------- | :------------------------------------------------------- | --------------------- |
| 18624      | 輪るピングドラム                                         | 回转企鹅罐            |
| 2487       | ペンギン娘♥はぁと                                        | 企鹅娘                |
| 72669      | よなよなペンギン                                         | 午夜企鹅              |
| 82723      | Dr.スランプ アラレちゃん んちゃ!ペンギン村はハレのち晴れ | 阿拉蕾 企鹅村是大晴天 |
| 82725      | Dr.スランプ アラレちゃん んちゃ!ペンギン村より愛をこめて | 阿拉蕾 来自企鹅村的爱 |
| 116276     | Penguins of Madagascar                                   | 马达加斯加的企鹅      |
| 226813     | 冰箱里的企鹅                                             |                       |
| 239270     | ペンギン・ハイウェイ                                     | 企鹅公路              |

### 按名称和开始日期查询作品

```sql
SELECT bangumi_id, `name`, name_cn
FROM `bangumi__type2` WHERE
MATCH (`name`, `name_cn`) AGAINST ('回转企鹅罐')
AND `begin` = '2011-07-07'
```

| bangumi_id | name             | name_cn    |
| ---------- | ---------------- | ---------- |
| 18624      | 輪るピングドラム | 回转企鹅罐 |

### 按作品ID和章节序号查询章节

```sql
SELECT ep_id, `name`, name_cn
FROM bangumi_ep WHERE
B_bangumi_id = 18624 AND sort = 2 AND type = 0
```

| ep_id  | name           | name_cn        |
| ------ | -------------- | -------------- |
| 102708 | 危険な生存戦略 | 危险的生存战略 |

### 搜索名字中含有“彼方”的角色（两种方法）

```sql
SELECT character_id, `name`, name_cn
FROM `bgm_character` WHERE
MATCH (`name`, `name_cn`) AGAINST ('彼方')
```

```sql
SELECT character_id, `name`, name_cn
FROM `bgm_character` WHERE
`name` LIKE '%彼方%' OR `name_cn` LIKE '%彼方%'
```

| character_id | name             | name_cn   |
| ------------ | ---------------- | --------- |
| 6126         | 泉かなた         | 泉彼方    |
| 11384        | 黒須カナタ       | 黑须彼方  |
| 13847        | 白姫彼方         | 白姬彼方  |
| 16323        | 東雲彼方         | 东云彼方  |
| 17881        | 星野彼方         |           |
| 18455        | 空深彼方         | 空深彼方  |
| 21122        | 加茂カナタ       | 加茂彼方  |
| 25881        | 野々宮彼方       |           |
| 26424        | 日向かなた       | 日向彼方  |
| 28156        | 天都かなた       | 天都彼方  |
| 28909        | カナタ王子       | 彼方王子  |
| 32349        | カナタ・エイジ   | 彼方·英司 |
| 37858        | 黛彼方           |           |
| 42452        | 近江彼方         | 近江彼方  |
| 52786        | 品輪彼方         | 品轮彼方  |
| 62005        | 比嘉かなた       | 比嘉彼方  |
| 69356        | カナタ・ホシジマ | 彼方·星岛 |
| 74545        | 天音かなた       | 天音彼方  |

### 搜索名字中含有“昴”的角色（ngram 最小分词长度默认为2，无法搜索单字）

> 问题来源：https://www.bilibili.com/bangumi/play/ss6306


```sql
SELECT character_id, `name`, name_cn
FROM `bgm_character` WHERE
`name` LIKE '%昴%' OR `name_cn` LIKE '%昴%'
```

由于主要使用动画作品相关资料建立数据库，故查询结果不全

| character_id | name             | name_cn    |
| ------------ | ---------------- | ---------- |
| 1298         | 濑川昴           |            |
| 2918         | スバル・リョーコ | 昴凉子     |
| 8222         | 昴               |            |
| 13431        | 近衛スバル       | 近卫昴     |
| 13699        | 弓塚すばる       | 弓塚昴     |
| 13784        | 長谷川昴         | 长谷川昴   |
| 14610        | 劉昴星           | 刘昴星     |
| 17258        | 日高昴           | 日高昴     |
| 17467        | 逆巻スバル       | 逆卷昴     |
| 20193        | スバル・ナカジマ | 昴·中岛    |
| 20255        | 相葉昴治         | 相叶昴治   |
| 20428        | 朝日奈昴         | 朝日奈昴   |
| 23903        | 七星昴           | 七星昴     |
| 29453        | すばる           | 昴         |
| 31180        | 昴大和           |            |
| 32457        | 牧瀬昴           | 牧濑昴     |
| 32683        | プレアデス星人   | 昴宿星团人 |
| 34804        | 安藤昴           |            |
| 35607        | ナツキ・スバル   | 菜月昴     |
| 36294        | 永吉昴           | 永吉昴     |
| 36490        | 内巻すばる       | 内卷昴     |
| 38070        | 若葉昴           | 若叶昴     |
| 40022        | 明星スバル       | 明星昴流   |
| 40607        | 城ヶ崎昴         | 城之崎昴   |
| 62465        | 皇昴流           | 皇昴流     |
| 68202        | 大空スバル       | 大空昴     |
| 69630        | 天乃原すばる     | 天乃原昴   |
| 76459        | スバル           | 昴         |
| 77809        | スバル           | 昴         |
