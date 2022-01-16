# %%
import re
import os
from pathlib import Path
import codecs
import pandas as pd
import pysubs2
import pymysql

ptn = re.compile(r'[\t\n\r\f]')

con = pymysql.connect(host="localhost", user="dutbit",
                      password="12345678", database="anime")
cursor = con.cursor(pymysql.cursors.DictCursor)

dataSheet = []

pth = Path("../sub_share/subs_list/animation")
for fPath in pth.rglob('*.ass'):
    try:
        try:
            subs = pysubs2.load(fPath)
        except Exception as e:
            subs = pysubs2.load(fPath, encoding="utf-16")
        fPath = str(fPath).replace("'", "''")
        V_path = fPath[33:]
        sql = f"SELECT ass_id, `name` FROM `ass_file` WHERE V_path='{V_path}'"
        cursor.execute(sql.replace("\\", "\\\\"))
        res_assid = cursor.fetchone()
        assID = res_assid['ass_id'] if(res_assid) else 0

        print(assID, fPath)
        for line in subs.events:
            if line.is_comment or line.is_drawing or "fx" in line.effect or "ed" in line.style or "op" in line.style:
                continue
            start = pysubs2.time.ms_to_times(line.start)
            end = pysubs2.time.ms_to_times(line.end)
            text = ptn.sub("", line.plaintext)
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
            else:
                with codecs.open("log/errlog_py.txt", 'a', encoding='utf-8') as f:
                    f.write(f"{str(fPath)}\ntext too long\n{text}\n")
    except Exception as e:
        print(e)
        with codecs.open("log/errlog_py.txt", 'a', encoding='utf-8') as f:
            f.write(f"{str(fPath)}\n{str(e)}\n")
    if len(dataSheet) > 1000000:
        df = pd.DataFrame(dataSheet)
        df.to_csv('assDia/'+fPath[33:55].replace("\\", "")+'.csv')
        # SyntaxError: f-string expression part cannot include a backslash
        dataSheet = []

if len(dataSheet) > 0:
    df = pd.DataFrame(dataSheet)
    df.to_csv(f'assDia/{str(pth)[-4:]}({str(pth)[-4:]}).csv')
    dataSheet = []
