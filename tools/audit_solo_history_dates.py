"""Audit original release dates and artist ownership across every saved solo workbook."""
from pathlib import Path
import json
import re
import unicodedata
from collections import defaultdict

ROOT=Path(__file__).resolve().parents[1]
load=lambda p:json.loads((ROOT/p).read_text(encoding='utf-8'))
catalog={a['key']:a for a in load('data/catalog.json')['solo']}
albums=load('data/solo-albums.json')
references=load('data/solo-legacy-track-links.json')['byIndex']
reference=load('solo-2026-11-06.json')
owners=['Jeonghan','Joshua','Jun','Hoshi','Wonwoo','Woozi','Dokyeom','Mingyu',
        'The8','Seungkwan','Vernon','Dino','BSS','JxW','HxW','CxM','DxS']

def norm(value):
    return ''.join(char for char in unicodedata.normalize('NFKC',str(value or '')).casefold() if char.isalnum())

def kind(name):
    if re.search(r'TOTAL STREAMS\s*$',name,re.I) or norm(name)=='picheolinstreams':return 'grand'
    if re.search(r'monthly\s+listeners?|followers?',name,re.I):return 'audience'
    if re.search(r'\b(?:total|tota;)\s*:?$',name,re.I):return 'album'
    return 'track'

def groups(snapshot):
    rows=[{'id':key,'name':name,'value':snapshot.get('tracks',{}).get(key),
           'index':int(key.rsplit(':',1)[-1])}
          for key,name in snapshot.get('names',{}).items()
          if key.rsplit(':',1)[-1].isdigit()]
    rows.sort(key=lambda row:row['index'])
    result={}
    cursor=0
    for owner in owners:
        end=next((i for i in range(cursor,len(rows))
                 if norm(rows[i]['name'])==norm(owner+' TOTAL STREAMS')),None)
        if end is None:continue
        result[owner]=rows[cursor:end+1];cursor=end+1
    for owner,term in (('V8','v8total'),('Picheolin','picheolinstreams'),
                       ('Gilboard','gilboardtotal'),('JxJ','dreamscapetotal')):
        end=next((i for i in range(cursor,len(rows))
                if (owner=='Gilboard' and 'gilboard' in norm(rows[i]['name']) and
                    kind(rows[i]['name'])=='album')
                or (owner!='Gilboard' and norm(rows[i]['name'])==term)),None)
        if end is None:continue
        result[owner]=rows[cursor:end+1];cursor=end+1
    return result

reference_groups=groups(reference)
index_full_albums={value:(a,key) for a in albums
                   for key,value in a.get('legacyTotalIndices',{}).items()}
reference_indices={int(key):entry for key,entry in references.items()}

def matching_index(group_rows,owner,row,row_kind,prev):
    if owner=='Hoshi' and row_kind=='album' and norm(row['name'])=='shingirutotal' \
            and prev and norm(prev['name'])=='spider' and prev['value']==row['value']:
        return None
    label=norm(row['name'])
    unnamed=row_kind=='album' and prev and norm(prev['name'])==label and prev['value']==row['value']
    referencelabel=label+'total' if unnamed else label
    ref=[x for x in reference_groups.get(owner,[])
         if norm(x['name'])==referencelabel and kind(x['name'])==row_kind]
    prev_matching=[x for x in group_rows if x['index']<=row['index']
                   and norm(x['name'])==label
                   and (kind(x['name'])==row_kind or x['index']==row['index'])]
    nth=0 if unnamed else len(prev_matching)-1
    return ref[nth]['index'] if nth>=0 and nth<len(ref) else None

audited=0
dated=0
skipped_future=0
missing=[]
all_files=sorted(set(ROOT.glob('solo-20??-??-??.json'))|
                 set((ROOT/'data/history').glob('solo-20??-??-??.json')))
for path in all_files:
    snapshot=json.loads(path.read_text(encoding='utf-8'))
    date=snapshot.get('date','')
    for owner,rows in groups(snapshot).items():
        for row in rows:
            row_kind=kind(row['name'])
            if row_kind in ('audience','grand'):continue
            idx=row['index']
            prev=next((x for x in rows if x['index']==idx-1),None)
            unlabeled=(owner=='BSS' and prev and prev['value']==row['value'] and
                       norm(prev['name'])==norm(row['name']) and
                       'goodday2025' in norm(row['name']))
            if unlabeled:row_kind='album'
            audited+=1
            reference_index=matching_index(rows,owner,row,row_kind,prev)
            found=None
            if row_kind=='album':
                full=index_full_albums.get(reference_index)
                if full:found=full[0].get('releaseDate')
                elif prev:
                    prev_index=matching_index(rows,owner,prev,kind(prev['name']),
                                               next((x for x in rows if x['index']==idx-2),None))
                    entry=reference_indices.get(prev_index)
                    found=catalog.get(entry.get('releaseKey'),{}).get('release_date') if entry else None
            else:
                entry=reference_indices.get(reference_index)
                if entry:
                    item=catalog.get(entry['releaseKey'],{})
                    found=item.get('track_release_dates',{}).get(entry['id']) or item.get('release_date')
            if found and found>date:
                skipped_future+=1
                continue
            if not found:
                missing.append((date,owner,idx,row['name']))
            else:
                dated+=1

print('Snapshots:',len(all_files),'Historical rows:',audited,
      'Dated:',dated,'Future/unreleased filtered:',skipped_future,
      'Missing:',len(missing))
for issue in missing[:80]:print('MISSING',*issue,sep=' | ')
if missing:raise SystemExit(f'{len(missing)} historical rows lack safe original-release date mapping')
