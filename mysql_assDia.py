# %%
import re
import os
from pathlib import Path
import codecs
import pandas as pd
import pysubs2
import pymysql

pattern = re.compile(r'[\t\n\r\f]')

db = pymysql.connect(host="localhost", user="dutBit",
                     password="12345678", database="anime")
cursor = db.cursor()
dataSheet = []

# %%
for curDir, dirs, files in os.walk("subs_list\\animation\\2021"):
    for file in files:
        if file.endswith(".ass"):
            try:
                fullPath = Path(curDir, file)
                try:
                    subs = pysubs2.load(fullPath)
                except Exception as e:
                    subs = pysubs2.load(fullPath, encoding="utf-16")
                fullPath = str(fullPath).replace("'", "''")
                V_path = fullPath[20:]
                sql = f"SELECT ass_id, `name` FROM `ass_file` WHERE V_path='{V_path}'"
                cursor.execute(sql.replace("\\", "\\\\"))
                results_assid = cursor.fetchall()
                assID = results_assid[0][0] if(len(results_assid)) else 0

                # sql = f"SELECT COUNT(*) FROM ass_dialogue_11 WHERE B_ass_id={assID}"
                # cursor.execute(sql)
                # num = cursor.fetchall()[0][0]
                # if num:
                #     print("skip:", assID)
                #     continue

                print(assID, fullPath)
                for line in subs.events:
                    if line.is_comment or line.is_drawing or "fx" in line.effect or "ed" in line.style or "op" in line.style:
                        continue
                    start = pysubs2.time.ms_to_times(line.start)
                    end = pysubs2.time.ms_to_times(line.end)
                    text = pattern.sub("", line.plaintext)
                    if len(text) < 255:
                        dataSheet.append({'start_hour': start.h,
                                          'start_min': start.m,
                                          'start_sec': start.s,
                                          'start_csec': start.ms//10,
                                          'end_hour': end.h,
                                          'end_min': end.m,
                                          'end_sec': end.s,
                                          'end_csec': end.ms//10,
                                          'style': line.style,
                                          'name': line.name,
                                          'effect': line.effect,
                                          'text': text,
                                          'B_ass_id': assID,
                                          })
            except Exception as e:
                print(e)
                with codecs.open("errlog.txt", 'a', encoding='utf-8') as f:
                    f.write(str(fullPath)+"\n")
                    f.write(str(e)+"\n")

    if len(dataSheet) > 500000:
        df = pd.DataFrame(dataSheet)
        df.to_csv('csv\\'+curDir.replace("\\", "")+'.csv')
        dataSheet = []

if len(dataSheet) > 0:
    df = pd.DataFrame(dataSheet)
    df.to_csv('csv\\'+curDir.replace("\\", "")+'.csv')
    dataSheet = []
# %%
