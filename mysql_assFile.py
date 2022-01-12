# %%
from pathlib import Path
import os
import re
import codecs
import pymysql

ptn = re.compile(
    r'^subs_list\\animation\\(?P<year>\d{4})\\\((?P<date>\d+\.\d+\.\d+)\)(?P<name>[^\\]+)\\(?P<source>[^\\]+)\\(?P<sub_name>.+)\\(?P<file_name>[^\\]+)$')
ptn_epSort = re.compile('(^|\D)(\d\d)\D')

db = pymysql.connect(host="localhost", user="dutbit",
                     password="12345678", database="anime")
cursor = db.cursor()

for curDir, dirs, files in os.walk("../sub_share/subs_list/animation"):
    print(curDir)
    for file in files:
        if file.endswith(".ass"):
            try:
                fullPath = Path(curDir, file)
                print("[Path]"+str(fullPath))
                matches = ptn.match(str(fullPath).replace("'", "''"))
                print(matches.groupdict())
                epSearch = ptn_epSort.search(
                    matches['file_name'].replace("11F", "").replace("11eyes", ""))
                if epSearch is not None:
                    epSort = epSearch.group(2)
                else:
                    epSort = 0
                print(epSort)

                sql = f"""
SELECT bangumi_id, `name`, name_cn
FROM `bangumi__type2` WHERE
MATCH (`name`, `name_cn`) AGAINST ('{matches['name']}')
AND `begin` = '{matches['date']}';"""
                cursor.execute(sql)
                results_id = cursor.fetchall()

                if(len(results_id)):
                    bgmID = results_id[0][0]
                    sql = f"SELECT * FROM bangumi_ep WHERE B_bangumi_id={results_id[0][0]} and sort={epSort}"
                    cursor.execute(sql)
                    results_epid = cursor.fetchall()
                    epID = results_epid[0][0] if(len(results_epid)) else 0
                else:
                    bgmID = 0
                    epID = 0

                sql = f"INSERT INTO ass_file VALUES (0,'{matches['year']}','{matches['date']}','{matches['name']}','{matches['source']}','{matches['sub_name']}','{matches['file_name']}',{epSort},{epID},{bgmID})"

                cursor.execute(sql.replace("\\", "\\\\"))
                db.commit()
            except Exception as e:
                db.rollback()
                print(e)
                with codecs.open("errlog.txt", 'a', encoding='utf-8') as f:
                    f.write(str(fullPath)+"\n")
                    f.write(str(e)+"\n")

db.close()
# %%
