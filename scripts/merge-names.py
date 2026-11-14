#!/usr/bin/env python3
"""Merges the patrike's Kannada committees, Mahadanis and supporters (pages 9 to 12) into src/content/committees.json
as its `kn` field. The patrike prints them in its own groups and order, so they stay its own lists, as printed.
usage: python3 scripts/merge-names.py NAMES.json   (from the two-pass glyph-checked transcription)"""
import json
import pathlib
import sys

src = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'))
path = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'content' / 'committees.json'
data = json.loads(path.read_text(encoding='utf-8'))
clean = lambda s: (s or '').strip().rstrip(',').strip() or None

data['kn'] = {
    'source': 'patrike-print-kannada-12pp.pdf pages 9 to 12, transcribed and checked glyph by glyph in two passes on 2026-11-14',
    'groups': [{
        'title': clean(g['title_kn']),
        'parent': clean(g.get('parent_kn')),
        'members': [{'name': clean(m['name_kn']), 'place': clean(m.get('place_kn')), 'role': clean(m.get('role_kn'))} for m in g['members']],
    } for g in src['committees']],
    'mahadanis_heading': clean(src['mahadanis_heading_kn']),
    'mahadanis': [{'name': clean(m['name_kn']), 'place': clean(m.get('detail_kn')), 'role': None} for m in src['mahadanis']],
    'supporters_heading': clean(src['supporters_heading_kn']),
    'supporters': [{'name': clean(m['name_kn']), 'place': clean(m.get('detail_kn')), 'role': None} for m in src['supporters']],
}
path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
kn = data['kn']
print('committees:', len(kn['groups']), 'groups,', sum(len(g['members']) for g in kn['groups']), 'names;',
      len(kn['mahadanis']), 'mahadanis;', len(kn['supporters']), 'supporters')
