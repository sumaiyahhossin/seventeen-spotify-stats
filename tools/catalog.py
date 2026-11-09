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
            prefix=s[:s.find(line)]
            prior=[x.strip().lstrip('/').strip() for x in prefix.splitlines()[-4:] if x.strip().startswith('//')]
            description=prior[-1] if prior else var
            title=re.sub(r'^g\d+\s*:\s*','',description,flags=re.I).split('(')[0].split(':')[0].strip() or var
            entries.append({'key':var,'title':title,'description':description,'artist':owner,'tracks':urls})
    return entries

if __name__=='__main__':
    target = ROOT / 'data' / 'catalog.json'
    previous = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}
    updated = {'group': build('group'), 'solo': build('solo')}
    # Preserve curated original-release metadata during daily catalog regeneration.
    # Album dates cannot override a track's earlier pre-release date.
    for kind in ('group', 'solo'):
        existing = {entry['key']: entry for entry in previous.get(kind, [])}
        for entry in updated[kind]:
            saved = existing.get(entry['key'], {})
            for field in ('release_date', 'track_release_dates'):
                if field in saved:
                    entry[field] = saved[field]
    # Administrative releases are stored outside the generated Java catalog.
    # Merge at each run so a Java re-scan can never erase an admin addition.
    admin_path=ROOT/'data'/'admin-releases.json'
    admin=json.loads(admin_path.read_text(encoding='utf-8')) if admin_path.exists() else {}
    for release in admin.get('releases', []):
        kind=release.get('scope')
        if kind not in updated: continue
        key=release.get('key')
        if not key or not isinstance(release.get('tracks'),list): continue
        entry={
            'key':key,
            'title':release.get('title',''),
            'description':release.get('title',''),
            'artist':release.get('artist','SEVENTEEN'),
            'tracks':release['tracks'],
            'release_date':release.get('release_date'),
            'release_type':release.get('release_type','single'),
            'admin_added':True,
            'track_titles':release.get('track_titles',{}),
        }
        # A source-code release with the same key takes priority.
        if not any(item['key']==key for item in updated[kind]):
            updated[kind].append(entry)
    target.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
