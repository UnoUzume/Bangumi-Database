# %%
from pathlib import Path
import re
import codecs
import pymysql

ptn = re.compile(
    r'subs_list\\animation\\(?P<year>\d{4})\\\((?P<date>\d+\.\d+\.\d+)\)(?P<name>[^\\]+)\\(?P<source>[^\\]+)\\(?P<sub_name>.+)\\(?P<file_name>[^\\]+)$')
ptn_epSort = re.compile('(^|\D)(\d\d)\D')

con = pymysql.connect(host="localhost", user="dutbit",
                      password="12345678", database="anime")
cursor = con.cursor(pymysql.cursors.DictCursor)

sqlID = """
SELECT bangumi_id, `name`, name_cn
FROM `bangumi__type2` WHERE
MATCH (`name`, `name_cn`) AGAINST (%s)
AND `begin` = %s"""
sqlEp = "SELECT ep_id FROM bangumi_ep WHERE B_bangumi_id=%s and sort=%s"
sqlASS = """
INSERT IGNORE INTO `ass_file` (`year`, `date`, `name`, `source`, `sub_name`, `file_name`, `ep_sort`, `B_ep_id`, `R_bangumi_id`)
VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
lstParams = []

pth = Path("../sub_share/subs_list/animation")
for fPath in pth.rglob('*.ass'):
    try:
        epSort = 0
        epID = 0
        bgmID = 0

        matches = ptn.search(str(fPath).replace("'", "''"))
        # print(matches.groupdict())
        epSearch = ptn_epSort.search(
            matches['file_name'].replace("11F", "").replace("11eyes", ""))
        epSort = int(epSearch.group(2)) if epSearch else 0

        cursor.execute(sqlID, (matches['name'], matches['date']))
        res_id = cursor.fetchone()
        if(res_id):
            bgmID = res_id['bangumi_id']
            cursor.execute(sqlEp, (res_id['bangumi_id'], epSort))
            res_epid = cursor.fetchone()
            epID = int(res_epid['ep_id']) if(res_epid) else 0
        lstParams.append((matches['year'], matches['date'], matches['name'],
                          matches['source'], matches['sub_name'], matches['file_name'], epSort, epID, bgmID))
    except Exception as e:
        con.rollback()
        print(e)
        with codecs.open("log/errlog_py.txt", 'a', encoding='utf-8') as f:
            f.write(f"{str(fPath)}\n{str(e)}\n")
    if len(lstParams) > 100:
        print("[Path] "+str(fPath))
        cursor.executemany(sqlASS, lstParams)
        con.commit()
        lstParams = []

if len(lstParams) > 0:
    cursor.executemany(sqlASS, lstParams)
    con.commit()
con.close()
