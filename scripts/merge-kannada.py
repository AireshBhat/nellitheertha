#!/usr/bin/env python3
"""Merges the verified Kannada from the printed patrike into src/content/*.json as `kn` fields.
The patrike's structure is kept: a section's Kannada entries are its own list, in printed order, because the
patrike splits and combines entries differently from the English invitation.
usage: python3 scripts/merge-kannada.py DIR   (DIR holds A-D.verified.json from the verification workflow)"""
import json
import pathlib
import re
import sys

src = pathlib.Path(sys.argv[1])
content = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'content'
text = lambda v: v['text'] if isinstance(v, dict) else v  # the verifiers kept a few strings together with their notes
kn = lambda s: bool(re.search('[ಀ-೿]', s or ''))

prog_path = content / 'programme.json'
prog = json.loads(prog_path.read_text(encoding='utf-8'))
days_kn = [d for b in 'BCD' for d in json.loads((src / f'{b}.verified.json').read_text(encoding='utf-8'))['days']]
for d in days_kn:
    blocks = [x for x in prog['days'] if x['date'] == d['date']]
    assert blocks, d['date']
    blocks[0]['kn'] = {'heading': d['heading_kn'], 'notes': d.get('notes_kn') or []}
    for s in d['sections']:
        target = next(sec for x in blocks for sec in x['sections'] if sec['name'] == s['en_section'])
        target['kn'] = {'name': s['name_kn'], 'items': [
            {'time': it.get('time_kn') or '', 'text': it['text_kn'], 'details': [x for x in (it.get('details_kn') or []) if x]}
            for it in s['items']]}
prog_path.write_text(json.dumps(prog, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

inv_path = content / 'invitation.json'
inv = json.loads(inv_path.read_text(encoding='utf-8'))
A = json.loads((src / 'A.verified.json').read_text(encoding='utf-8'))
B = json.loads((src / 'B.verified.json').read_text(encoding='utf-8'))
letter = A['letter_kn']
instructions = sorted(A['special_instructions_kn'], key=lambda x: x['en_index'])
bank = A['bank_kn']
inv['kn'] = {
    'programme_title': text(B['page_title_kn']),
    'special_instructions_heading': text(A['special_instructions_heading_kn']),
    'special_instructions': [x['text'] for x in instructions],
    'bank': {'heading': bank['heading'], 'intro': bank['intro'], 'lines': [l for l in bank['lines'] if kn(l)], 'contact_line': bank['contact_line']},
    'letter': {
        'header_lines': letter['header_lines'], 'verse': letter['verse'], 'address_lines': letter['address_lines'],
        'salutation': letter['salutation'], 'blocks': [{'type': b['type'], 'text': b['text']} for b in letter['blocks']],
        'closing_lines': letter['closing_lines'],
        'signatories': [{'name': s['name_kn'], 'role': s['role_kn']} for s in letter['signatories']],
    },
}
inv_path.write_text(json.dumps(inv, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
n = sum(len(s['kn']['items']) for x in prog['days'] for s in x['sections'] if 'kn' in s)
print('programme: Kannada for', sum(1 for x in prog['days'] if 'kn' in x), 'day blocks,', n, 'entries; invitation: letter,', len(instructions), 'instructions, bank')
