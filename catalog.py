import re, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]

def build(kind):
    s=(ROOT/'src'/('Stream_Stats.java' if kind=='group' else 'Stream_Stats_Units_Duos.java')).read_text()
    entries=[]; owner='SEVENTEEN'; arrays={}
    for line in s.splitlines():
        m=re.search(r'//\s*artist:\s*(.+)',line,re.I)
        if m: owner=m.group(1).strip().title()
        m=re.search(r'String\[\]\s+(\w+)\s*=\s*\{(.+?)\};',line)
        if m:
            var=m.group(1); urls=re.findall(r'https://open\.spotify\.com/track/([A-Za-z0-9]+)',m.group(2))
            if not urls: continue
            arrays[var]=urls
            # Use nearby descriptive comments rather than inventing names.
            prefix=s[:s.find(line)]
            prior=[x.strip().lstrip('/').strip() for x in prefix.splitlines()[-4:] if x.strip().startswith('//')]
            description=prior[-1] if prior else var
            title=re.sub(r'^g\d+\s*:\s*','',description,flags=re.I).split('(')[0].split(':')[0].strip() or var
            entries.append({'key':var,'title':title,'description':description,'artist':owner,'tracks':urls})
    return entries

if __name__=='__main__':
    (ROOT/'data'/'catalog.json').write_text(json.dumps({'group':build('group'),'solo':build('solo')},ensure_ascii=False,indent=2))
