#!/usr/bin/env python3
"""Writes the content pages of Pass 01 from the earlier nellitheerthatemple.in.

Every sentence is ported from the old site (reference/live-site-source-github) or
from the 2024 appeal (Appeal_English.pdf). Only typos and spacing are fixed, and
"Shree"/"Shri" become "Sri" to match the rest of the site. Run from pass-01/:
    python3 _build/pages.py
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = ROOT.parent.parent.parent / 'reference' / 'live-site-source-github'

ICON = ("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 18 24%27%3E%3Cpath "
        "d=%27M9 1C9 1 2 11 2 16a7 7 0 0 0 14 0C16 11 9 1 9 1Z%27 fill=%27%23273c1a%27/%3E%3C/svg%3E")

# Order, titles and one-line descriptions. The home page's list uses the same.
PAGES = [
    ('brahmakalasha', 'Brahmakalasha 2026', 'The programme for 20 to 30 December 2026, day by day'),
    ('temple', 'The temple', 'Deities, the bhootas and the places around the temple'),
    ('history', 'History', 'Recorded since 1487 AD, under the Chowta family'),
    ('story', 'The birth of Nellitheertha', 'The story that led to the creation of the temple'),
    ('cave', 'The cave', 'The passage, the lake inside, and the months it is open'),
    ('sevas', 'Sevas', 'The poojas and offerings made at the temple'),
    ('jaatre', 'The annual jaatre', 'The festival in Dhanur Masa, the Bhoota Kola and the temple calendar'),
    ('mantras', 'Mantras', 'Mantras of Lord Shiva, in Kannada'),
    ('gallery', 'Gallery', 'Photographs from the temple'),
    ('appeal', 'Appeal for renovation', 'The 2024 appeal, the estimates and the committees'),
    ('visit', 'How to reach', 'Four routes, the address and contact numbers'),
]


def e(text):
    return html.escape(text, quote=False)


def smart(text):
    text = re.sub(r'(^|[\s(\[])"', '\\1\u201c', text)
    text = text.replace('"', '\u201d')
    text = re.sub(r"(\w)'(\w)", '\\1\u2019\\2', text)
    text = re.sub(r"(^|[\s(])'", '\\1\u2018', text)
    return text.replace("'", '\u2019')


STORY_FIXES = [
    ('Hindus- Brahma', 'Hindus: Brahma'),
    ('lieutenants- Chanda and Prachanda to', 'lieutenants, Chanda and Prachanda, to'),
    ('Jabali- "O', 'Jabali: "O'),
    ('peform', 'perform'), ('creeps and flowers', 'creepers and flowers'),
    ('marvelous site', 'marvelous sight'), ('yaganas', 'yagnas'),
    ('Trimurties', 'Trimurtis'), ('goose berry', 'gooseberry'),
    ('Shree ', 'Sri '), ('Shri ', 'Sri '),
    (' .', '.'), (' ,', ','), ('( ', '('), (' )', ')'),
]


def story_blocks():
    source = (REF / 'index.html').read_text(encoding='utf-8')
    section = source[source.index('id="birth"'):source.index('id="contact"')]
    blocks = []
    for m in re.finditer(r'<b>(.*?)</b>|<p>(.*?)</p>', section, re.S):
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        text = html.unescape(re.sub(r'<[^>]+>', '', raw))
        text = re.sub(r'\s+', ' ', text).strip()
        for a, b in STORY_FIXES:
            text = text.replace(a, b)
        if text:
            blocks.append(('h' if m.group(1) is not None else 'p', smart(text)))
    return blocks


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def header(prefix):
    return f'''  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header">
    <a class="brand" href="{prefix or './'}" aria-label="Nellitheertha home">
      <svg viewBox="0 0 18 24" aria-hidden="true"><path d="M9 1C9 1 2 11 2 16a7 7 0 0 0 14 0C16 11 9 1 9 1Z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
      <span>Nellitheertha</span><span class="preview-tag">Preview</span>
    </a>
    <nav class="main-nav" aria-label="Main navigation">
      <a href="{prefix}brahmakalasha/">Brahmakalasha</a>
      <a href="{prefix}#pages">About</a>
      <a href="{prefix}visit/">Visit</a>
      <a href="{prefix}#contribute">Contribute</a>
    </nav>
    <a class="page-home" href="{prefix or './'}">Home</a>
  </header>'''


def footer(prefix):
    items = '\n'.join(f'          <li><a href="{prefix}{s}/">{e(t)}</a></li>' for s, t, _ in PAGES)
    return f'''  <footer>
    <p class="footer-name" lang="kn">ಶ್ರೀ ಕ್ಷೇತ್ರ ನೆಲ್ಲಿತೀರ್ಥ</p>
    <p>Sri Somanatheshwara Guhalaya<br>Neerude Post, Kompadavu Village, Mangaluru Taluk, D.K. District, Karnataka 574144</p>
    <p class="footer-contact"><a href="tel:+918088708914">+91 80887 08914</a> · <a href="tel:+918242299142">0824 2299142</a> · <a href="mailto:vbnellitheertha@yahoo.com">vbnellitheertha@yahoo.com</a></p>
    <nav class="footer-pages" aria-label="All pages">
      <ul>
          <li><a href="{prefix or './'}">Home</a></li>
{items}
      </ul>
    </nav>
    <p class="credit">The forest, the forest walk, the kere and the cave pictures were made with AI from photographs and footage of Nellitheertha. The sanctum picture on the home page is a real video frame restored with AI. All other photographs are real.</p>
  </footer>'''


def plate(src, alt, caption, kind='tall side', prefix='../'):
    cap = f'<figcaption>{e(caption)}</figcaption>' if caption else ''
    return (f'<figure class="plate {kind}"><img src="{prefix}assets/img/{src}" alt="{html.escape(alt)}" '
            f'loading="lazy">{cap}</figure>')


def write_page(slug_, eyebrow, title, lead, body, description, depth=1, back=None, nxt=None):
    p = '../' * depth
    if nxt is None:
        index = [s for s, _, _ in PAGES].index(slug_)
        nxt = PAGES[(index + 1) % len(PAGES)]
    back_href, back_label = back or (f'{p}#pages', 'Home')
    lead_html = f'\n        <p class="lead">{lead}</p>' if lead else ''
    doc = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f2f0ea">
  <meta name="description" content="{html.escape(description)}">
  <meta name="robots" content="noindex, nofollow">
  <title>{e(title)} · Nellitheertha</title>
  <link rel="icon" href="{ICON}">
  <link rel="stylesheet" href="{p}styles.css">
</head>
<!-- THROWAWAY EXPLORATION. Pass 01 by Claude. Content ported from the earlier nellitheerthatemple.in by _build/pages.py. -->
<body class="page" data-language="en">
{header(p)}

  <main id="content">
    <article class="article">
      <a class="back" href="{back_href}">{e(back_label)}</a>
      <header class="article-head">
        <p class="eyebrow">{e(eyebrow)}</p>
        <h1>{e(title)}</h1>{lead_html}
      </header>
      <div class="prose">
{body}
      </div>
      <nav class="next-page" aria-label="Next page"><a class="more" href="{p}{nxt[0]}/">Next: {e(nxt[1])}</a></nav>
    </article>
  </main>

{footer(p)}
</body>
</html>
'''
    out = ROOT / slug_ / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding='utf-8')
    print('wrote', out.relative_to(ROOT))


# ---------------------------------------------------------------- the temple
write_page('temple', 'ABOUT THE TEMPLE', 'The temple',
    'Sri Somanatheshwara Guhalaya in Nellitheertha, Karnataka, is dedicated to Sri Somanatheshwara (Shiva).',
    f'''        <h2 id="deities">Deities</h2>
        {plate('site/linga-2023-12.webp', 'A dark stone Linga in a golden frame, lamps burning above it', 'The Linga in the sanctum, December 2023')}
        <p>The main deity of the temple is Sri Somanatheshwara (Shiva). The temple also has Mahaganapati (the elephant-headed God) and Jabali Maharshi as deities here. In fact, the Jabali Maharshi Brindavana was recently constructed.</p>
        <p>The Lingam of Sri Somanatheshwara has been made out of pure Saligrama and is considered very sacred. The Lingam has been built as Ardhanareeshwara.</p>
        {plate('site/ganapati-2023-01.webp', 'Ganapati decorated with garlands of red, yellow and white flowers', 'Mahaganapati, January 2023')}
        <p>The temple of Sri Mahaganapati has been rebuilt recently and is splendid in itself.</p>
        <h2 id="bhootas">The bhootas</h2>
        <p>In typical Tulu-naadu (Tulu is the native language in this part of the woods) tradition, the temple also has its set of \u201cBhootas\u201d. Bhootas are considered as the \u201cGanas\u201d or warrior-assistants of the Gods. According to mythology, bhootas are appointees of Shiva and they administer the temple/village. The main bhootas of the Nellitheertha temple are Pili-Chamundi (Pili means Tiger in Tulu), Kshetrapala, Raktheshwari and Doomavathy.</p>
        <p><a href="../jaatre/#kola">The Bhoota Kola at the annual jaatre</a></p>
        <h2 id="around">Around the temple</h2>
        <p>There are other artifacts in and around the temple which are pointers to the past glory of this place. Among them are the \u201cArasule Mancha\u201d (King\u2019s seat), \u201cArasule Mantapa\u201d (King\u2019s abode) and the \u201cJina Vigraha\u201d (Jain statue).</p>
        <h3 id="arasule-mancha">Arasule Mancha</h3>
        <p>The \u201cArasule Mancha\u201d or King\u2019s seat is situated near the main entrance of the temple towards the north. Historical evidence suggests that this seat was where the king of the land used to be seated when he visited the temple. It is believed that even today, the spirits of the former rulers visit the place at night and so it is prohibited to sit on the seat after dusk.</p>
        <h3 id="nagappa-kere">Nagappa Kere</h3>
        <p>The \u201cNagappa Kere\u201d (Snake Pond) is a small pond situated to the north of the temple. This natural pond, along with its religious significance, is also a scenic spot. All devotees who want to enter the cave temple have to clean themselves by taking bath in this pond and only then are they allowed into the cave. The lake is at its best immediately after the monsoons (October to December) when its crystal clear water is a swimmer\u2019s delight. There are plans to build a small herbal park around this pond as also a small deer park.</p>
        <h3 id="amblattapadavu">Amblattapadavu</h3>
        <p>To the east of the temple\u2019s entrance is the Amblattapadavu hillock. This hillock is about 300 to 500 feet high and offers a splendid scenery from the top. One can spot places such as the Bajpe Airport, Mangalore, Panambur, the MRPL refinery and Surathkal. On a day with clear skies, one can even spot the Arabian Sea. Amblattapadavu offers a wonderful view of sunrise and sunset every day.</p>
        <h2 id="open-to-all">Open to all</h2>
        {plate('site/alankara-2023-12.webp', 'Two decorated deities with silver faces, covered in garlands', 'Alankara, December 2023')}
        <p>The Nellitheertha temple is a symbol of secularism. The temple and the cave is open to members of all beliefs and castes. Any person, above the age of 5, is allowed to enter the cave irrespective of gender. Truly, Nellitheertha is a special and model place.</p>''',
    'The deities, bhootas and surroundings of Sri Somanatheshwara Guhalaya, Nellitheertha.')

# ---------------------------------------------------------------- history
write_page('history', 'ABOUT THE TEMPLE', 'History and origin', '',
    '''        <p>The holy place Nellitheertha and the temple have a long and glorious history. Although the first recorded material mentioning Nellitheertha dates back to 1487 AD, there is ample evidence available at the place to suggest that the temple existed much before that. At its glorious peak, there used to be daily festivities performed under the aegis of the ruler of Nellitheertha. From that grand state, the temple gradually declined and its existence itself was threatened towards the later part of the twentieth century. Since then, devotees and well wishers have got together to restore the temple to its previous grandeur. With the blessings of Sri Somanatha, the temple renovation work is now on in full swing.</p>
        <p>In the state of Karnataka and indeed in entire India, the South Kanara district occupies a unique place. The evergreen forests, amazing flora and fauna, the numerous temples and places of worship and monuments all make this district a huge attraction. The lifestyle of the people here exemplifies the concept of unity in diversity. For the people of Dakshina Kannada, art worship is a means of reaching the God and enriching the culture of the land. Naturally, therefore, one can observe the people seeing God in everything they do. Throughout the land, beautiful caves and lakes have become centers of spiritual and religious significance. Also, this land has given a multitude of scholars, artists, kings and other great contributors to the nation.</p>
        <h2 id="chowta">The Chowta family</h2>
        <p>Historically, the Nellitheertha region was under the administration of the Chowta family. The Chowtas are a famous name in Tulu Naadu and it is said that the temple flourished under their administration and was a major center for religious and cultural activities under their reign. Even today, the descendants of the Chowta clan take an active interest in the maintenance and development of the temple.</p>
        <h2 id="jain">Jain influence</h2>
        <p>There are some artifacts and archeological evidence available at the temple which point to a Jain interest and influence at the temple. These are evidence to suggest that the temple and the region was probably under the administration of Jain kings of the region.</p>
        <p><a href="../story/">The birth of Nellitheertha</a>, the story of how the place came to be.</p>''',
    'The history of Sri Somanatheshwara Guhalaya, Nellitheertha: recorded since 1487 AD.')

# ---------------------------------------------------------------- the story
if (REF / 'index.html').exists():  # the old site's source lives outside this repo, in reference/
    blocks = story_blocks()
    intro = blocks[0][1]
    parts, contents = [], []
    for kind, text in blocks[1:]:
        if kind == 'h':
            contents.append(f'          <li><a href="#{slug(text)}">{e(text)}</a></li>')
            parts.append(f'        <h2 id="{slug(text)}">{e(text)}</h2>')
        else:
            parts.append(f'        <p>{e(text)}</p>')
    parts.append('        <p>Subsequently, there is historical evidence to suggest that the Chowta rulers of Moodabidri '
                 'handled the administration of the temple during the times of the Vijayanagara Empire and it is they '
                 'who built the beautiful Sri Somanatheshwara Temple at Nellitheertha.</p>')
    parts.append('        <p class="mantra">Sri Somanatheshwaraya Prasanna</p>')
    write_page('story', 'THE STHALA PURANA', 'The birth of Nellitheertha', e(intro),
        '        <ol class="contents" aria-label="Parts of the story">\n' + '\n'.join(contents) + '\n        </ol>\n'
        + '\n'.join(parts),
        'The story of the birth of Nellitheertha: Sage Jabali, Antar Ganga, the bhootas and Arunasura.')

# ---------------------------------------------------------------- the cave
write_page('cave', 'THE CAVE TEMPLE', 'The cave',
    'The cave is open only between October and April.',
    f'''        {plate('cave-wide.webp', 'The laterite overhang of the cave temple, with the dark of the cave beneath it', 'The cave as it is today. This picture was made with AI from a video frame of the cave.', kind='wide')}
        <h2 id="inside">Inside the cave</h2>
        <p>The main attraction of the temple is the cave. Situated right at the entrance of the temple towards the left of the main door, this huge cave is one of nature\u2019s wonders. Unspoilt by human indulgence, the cave is a nature lover\u2019s delight. A visit to the inside of the cave is considered a sacred and spiritual experience by devotees. The entrance to the cave is huge and wide. Within a few feet, the trail narrows down and one is forced to bend and crawl forward. Subsequently, one has to fall flat on the tummy and crawl ahead. Finally, after about 300 to 400 metres, the cave widens again and we find a huge lake in there. There is a natural Shiva Lingam in front of the lake and devotees pray and worship the lingam.</p>
        <p>The most amazing part of the cave is the fine quality of the mud available inside. It is said that the mud here has healing powers and is treated as prasadam by devotees. Right behind the Shiva Lingam, a second cave starts off. Not many people have ventured into this second cave till date. A few who have gone ahead vouch for the extreme terrain they have encountered. It surely will be challenging for the adventure lovers.</p>
        <h2 id="name">The name</h2>
        <p>The name Nellitheertha also has its etymological roots in the cave. Inside of the cave, drops of water, in the shape of amla (gooseberries) constantly keep dripping down. In fact, the lake is made up of these drops of water. Hence the name Nelli (Amla) Theertha (holy water).</p>
        <h2 id="october-to-april">October to April</h2>
        <p>Another unique aspect of the cave is that it is closed for nearly 6 months a year. The cave is open only between October and April. Though there are religious reasons associated with this (it is said that the cave is open 6 months a year for humans and is meant for Gods and Rishis the remaining 6 months), the point is that the 6 month break each year helps the cave to \u201crejuvenate\u201d. The water freshens up and the animals inside enjoy the lack of disturbance. Yes, there are plenty of animals inside the cave. Most common among them are snakes (of all varieties), scorpions, porcupines and thousands of bats. These are considered sacred and troubling or hurting the animals in any manner is strictly forbidden.</p>
        <h2 id="jabali">Maharshi Jabali</h2>
        <p>Legend also has it that Maharshi (Saint) Jabali used this cave as his abode. Hence the name Jabaleshwara for the presiding deity. It is believed that Maharshi Jabali performed Tapas (penance) here to Lord Durgaparameshwari to request her to kill Arunasura (a demon). It is said that Sri Durga acceded to Jabali\u2019s request and destroyed Arunasura at Kateel (another fabulous and famous temple town, very close to Nellitheertha). There is a spot inside the cave which is widely believed to be where Maharshi Jabali performed his Tapas.</p>
        <p>All devotees who want to enter the cave have to bathe in <a href="../temple/#nagappa-kere">Nagappa Kere</a> first. <a href="../gallery/">Photographs</a> of the temple are in the gallery.</p>''',
    'The cave at Nellitheertha: the passage, the lake and natural Linga inside, and why it is open only from October to April.')

# ---------------------------------------------------------------- sevas
SEVAS = [
    ('Shatha Rudrabhisheka', 'This literally means a bath involving 100 pots of water. Our scriptures suggest that Lord Shiva is fond of water. It is because of this fondness that we find river Ganga flowing from Lord Shiva\u2019s head. It is said that the easiest way to please Lord Somanatha is to shower him with water. Shatha Rudrabhisheka involves a mix of 100 pot-shower and Mangalarathis amidst the chanting of Rudra Suktha by 11 purohits. At the end, there is a grand Mangalarathi for the Lord.'),
    ('Ekadasha Rudrabhisheka', 'This is a smaller scale version of the Shatha Rudrabhisheka where 11 pots of water are offered to Lord Shiva followed by a grand Mangalarathi.'),
    ('Ganapati Homa', 'This is a very famous yagna performed to please Lord Ganapati. The rituals include offering all the favorite eateries of Lord Ganapati consisting of a dish made of sugarcane, jaggery, bananas, black til and ghee. The offerings are placed in the fire itself and are routed through Agni Deva, the God of fire (according to the Vedas, all offerings made through Yagnas are routed through Agni Deva).'),
    ('Ranga Pooja', 'This is a very special and colorful pooja offered to the Lord. Offerings are placed on wooden racks in front of the Lord and lamps are lit throughout the temple. This is also one of the most ritualistic poojas offered at Nellitheertha.'),
    ('Satyanarayana Pooja', 'Once every month, on the full moon day, people from the village gather and perform a community Satyanarayana Pooja. This is also a social occasion which lets people get together.'),
    ('Durga Namaskara Pooja', 'This pooja is very unique to South Kanara and involves worshipping Lord Sri Durga Parameshwari in the form of light. A lamp is placed in the midst of a colorful Rangoli and is decorated with flowers and jewellery. It is a treat to the eyes and is performed often at the temple.'),
    ('Bhoota Nemas', 'This is also popularly known as Bhoota Kola. It is a dance ritual offered to the Bhootas where a person assumes the role of a particular Bhoota and dances throughout the night trying to please the Bhoota. This is also a very ritualistic seva and is revered throughout South Kanara. Kolas are unique to South Kanara and every temple with either Lord Shiva or Lord Shakti as the deity has this ritual.'),
]
seva_html = '\n'.join(f'        <h2 id="{slug(n)}">{e(n)}</h2>\n        <p>{e(t)}</p>' for n, t in SEVAS)
write_page('sevas', 'OFFERINGS AT THE LORD\u2019S FEET', 'Sevas',
    'There are many forms of offerings that can be made to Lord Sri Somanatheshwara at Nellitheertha.',
    f'''        {plate('site/pooja-2023-12.webp', 'A priest performing a pooja in a small decorated mantapa at night', 'A pooja at the temple, December 2023')}
        <p>The sevas can be in the form of Pooja (worship), Yagna (fire ritual), Bhajane (singing devotional songs) or even just a visit and prayer. The most often conducted sevas and their descriptions are here below.</p>
{seva_html}
        <p><a href="../visit/#contact">Contact the temple</a></p>''',
    'The sevas offered at Sri Somanatheshwara Guhalaya, Nellitheertha.')

# ---------------------------------------------------------------- jaatre
CALENDAR = [
    ('Tula Sankramana', 'Cave opens'),
    ('Chathurdashi before Hunnime in Dhanur Masa (December to January)', '5 day annual festival'),
    ('Shivarathri', 'Shivarathri Utsava'),
    ('Ganesha Chathurthi', 'Ganesha Utsava, Daiva Parva'),
    ('Deepavali', 'Daiva Parva, Ranga Pooje'),
]
cal_rows = '\n'.join(f'            <tr><td>{e(a)}</td><td>{e(b)}</td></tr>' for a, b in CALENDAR)
write_page('jaatre', 'FESTIVALS', 'The annual jaatre',
    'Every year, around the last week of December, the Nellitheertha temple conducts its annual Jaatre (festival).',
    f'''        <p class="note">In 2026 the temple holds the Brahmakalasha, 20 to 30 December. <a href="../#programme">See the programme</a>.</p>
        {plate('site/procession-2023-01.webp', 'Devotees carrying the decorated deity in a procession', 'January 2023', kind='wide')}
        <p>This is a grand five day event full of religious and cultural ceremonies. One thing that strikes a visitor to the Jaatre is the sheer number of rituals and ceremonies associated with this event. Though it may appear superstitious to the \u201cnon-believer\u201d, it is a fascinating experience. Simply put, the Jaatre is the instrument the villagers use to express their gratitude and respect to the Gods and Bhootas. They offer their prayers to the Gods and Bhootas and seek their continued protection and pray for good rains and harvests year after year.</p>
        <p>The festival starts on the 14th day of the Shukla Paksha in Dhanur Maasa. Typically, this falls on the last week of December or the first week of January. The festival begins with a silver flag being hoisted to indicate the beginning of the Jaatre. This is called \u201cKodi\u201d or \u201cDhwajaarohana\u201d ceremony.</p>
        <p>Each of the four days has separate ceremonies like the \u201cBalis\u201d where the idol of the presiding deity is carried around the temple for a procession accompanied by music, the \u201cRudrabhishekas\u201d where the Shiva Lingam is given a grand shower with 101 vessels of water and the \u201cRathotsava\u201d where the deity is taken on a procession on the chariot.</p>
        <h2 id="aarat">The fourth day: Aarat</h2>
        <p>The climax of the festival is on the fourth day. Called the \u201cAarat\u201d in local language, the ceremonies on this day mark the end of the festival. During the day, the presiding deity is taken on a procession in the Ratha or the chariot. Villagers offer their prayers during the procession. There is also an event called as the Pilchandi Bheti (meeting of Pili-Chamundi with the Lord) where the Bhoota offers its prayers to the Lord during the procession and seeks his blessings and vows to carry on the role of protecting Dharma in the region. The rituals are followed by a grand lunch for one and all. The food on this day is considered as God\u2019s prasadam and no one leaves without having some.</p>
        <p>The rest of the ceremonies start late in the evening and go on till dawn next day. The deity is taken on a procession and villagers offer \u201cKatte Pooje\u201d or \u201cPlatform Pooja\u201d to the deity as it passes their residence. The deity is taken to the temple pond and is given a bath there. Devotees also take bath along with the deity as it\u2019s considered extremely sacred to do so. On the return journey to the temple, again, several Katte Poojes are offered. Finally, the flag is brought down to indicate the closure of the festival.</p>
        <h2 id="kola">The Bhoota Kola</h2>
        {plate('pili-torches-sm.webp', 'Pili-Chamundi in red and gold with a garlanded crown, torches blazing on either side', 'Pili-Chamundi, December 2023', kind='wide')}
        <p>The next day, respect is offered to the Bhootas in the form of the Bhoota Kola. This is a dance ritual where a man assumes the role of a Bhoota and performs a set of rituals. It is believed that the Bhoota enters the body of the person during the Kola. Locals revere the ceremony a lot and the word of the person, performing the dance, during the kola is considered law. Even today, local disputes are settled during the Kola. The grandest of all Bhoota kolas is that of the \u201cPili Chamundi\u201d Bhoota. It is a treat to the eyes what with the variety of colors on display. The kolas start early in the evening and continue till dawn the next day.</p>
        <p><a href="../gallery/">More photographs of the kola</a> are in the gallery.</p>
        <h2 id="calendar">Temple calendar</h2>
        <table class="data">
          <thead><tr><th scope="col">When</th><th scope="col">What</th></tr></thead>
          <tbody>
{cal_rows}
          </tbody>
        </table>''',
    'The annual jaatre of Nellitheertha, the Bhoota Kola and the temple calendar.')

# ---------------------------------------------------------------- mantras
ARCHIVE = 'https://web.archive.org/web/{stamp}/http://nellitheertha.com/docs-shaivam/{file}.pdf'
MANTRAS = [
    ('Laghunyasa', '20080509183854', 'ska_sk_lagunyasa'),
    ('Rudra Namakam', '20080509185243', 'ska_sk_namakam'),
    ('Rudra Chamakam', '20080514131329', 'ska_sk_camakam'),
    ('Sri Mrutyunjaya Stotra', '20080509183846', 'ska_sk_mrityujnjaya'),
    ('Sri Shiva Sahasranama', None, None),
    ('Sri Shiva Shadakshara Stotra', None, None),
]
mantra_items = '\n'.join(
    f'          <li><a href="{ARCHIVE.format(stamp=s, file=f)}">{e(n)}</a> (PDF, Kannada)</li>' if s
    else f'          <li>{e(n)} <span class="note">(no longer online)</span></li>' for n, s, f in MANTRAS)
write_page('mantras', 'SACRED MANTRAS', 'Mantras', '',
    f'''        <p class="mantra">Om Tat Purushaya Vidmahe,<br>Mahadevaya Dheemahi,<br>Tanno Rudra Prachodayaat</p>
        <p>The following are some of the important mantras related to Lord Shiva. Chanting them daily, or at least on a frequent basis, is a sure way of obtaining Lord Somanatha\u2019s blessings.</p>
        <p>The following documents are in Kannada and have been reproduced here with the kind permission of Shaivam.org. We acknowledge with thanks the permission of <a href="https://www.shaivam.org/">Shaivam.org</a> in letting us reproduce these documents here. Visit their website for more mantras in a wide variety of languages. The site is also a comprehensive portal for all information related to Lord Shiva.</p>
        <h2 id="pdf">Sacred mantras in PDF format</h2>
        <ul>
{mantra_items}
        </ul>
        <p class="note">These files were on nellitheertha.com, which is no longer online. The four linked here are copies kept by the Internet Archive.</p>''',
    'Mantras of Lord Shiva in Kannada, from the Nellitheertha temple website.')

# ---------------------------------------------------------------- gallery
NEW = [
    ('linga-2023-12', 'A dark stone Linga in a golden frame, lamps burning above it', 'The Linga in the sanctum, December 2023'),
    ('alankara-2023-01', 'The deity with a silver face, in garlands of red, white and green, a lamp burning in front', 'Alankara, January 2023'),
    ('ganapati-2023-01', 'Ganapati decorated with garlands of red, yellow and white flowers', 'Mahaganapati, January 2023'),
    ('alankara-2023-12', 'Two decorated deities with silver faces, covered in garlands', 'Alankara, December 2023'),
    ('procession-2023-01', 'Devotees carrying the decorated deity in a procession', 'Procession, January 2023'),
    ('pooja-2023-12', 'A priest performing a pooja in a small decorated mantapa at night', 'Pooja, December 2023'),
    ('masks-2023-12', 'Two masks, one silver and one brass, on a white cloth with flowers and lamps', 'December 2023'),
    ('kola-2023-01', 'A bhoota in a yellow mask and a tall silver crown, holding a sword', 'Bhoota Kola, January 2023'),
    ('kola-2023-12-a', 'A bhoota with a yellow painted face and a red and gold costume', 'Bhoota Kola, December 2023'),
    ('kola-2023-12-b', 'A bhoota with a large round frame of palm leaves behind it', 'Bhoota Kola, December 2023'),
    ('kola-2023-12-c', 'A bhoota at night among garlands and lamps', 'Bhoota Kola, December 2023'),
]
OLD = [
    ('orig', 'A pond with clear blue water and laterite edges'),
    ('orig2', 'The entrance arch of the temple, with its name'),
    ('orig1', 'A white shrine in an enclosed garden'),
    ('orig3', 'A small shrine beneath a tree'),
    ('route', 'Steps through the forest'),
    ('cave', 'The rock inside the cave'),
    ('hist', 'A Linga with lamps, inside the cave'),
    ('fest', 'A priest carrying the decorated deity on his head'),
    ('seva', 'Priests at a seva before the deity'),
    ('desc1', 'The deity, decorated with garlands'),
    ('main', 'A collage of the temple, its deities and its arch'),
]
new_html = '\n'.join(
    f'          <figure><img src="../assets/img/site/{n}-sm.webp" srcset="../assets/img/site/{n}-sm.webp 720w, '
    f'../assets/img/site/{n}.webp 1600w" sizes="(min-width: 700px) 40vw, 100vw" alt="{html.escape(a)}" loading="lazy">'
    f'<figcaption>{e(c)}</figcaption></figure>' for n, a, c in NEW)
old_html = '\n'.join(
    f'          <figure><img src="../assets/img/site/old-{n}.webp" alt="{html.escape(a)}" loading="lazy"></figure>'
    for n, a in OLD)
write_page('gallery', 'PHOTOGRAPHS', 'Gallery', '',
    f'''        <h2 id="2023">From the temple, 2023</h2>
        <div class="gallery">
{new_html}
        </div>
        <h2 id="earlier">From the earlier website</h2>
        <p class="note">These photographs were on the first nellitheertha.com website. Some are marked \u00a9 K.B. Mallya.</p>
        <div class="old-gallery">
{old_html}
        </div>''',
    'Photographs of Sri Somanatheshwara Guhalaya, Nellitheertha.')

# ---------------------------------------------------------------- appeal
ESTIMATES = [
    ('New office building (2 floors)', '13.50'), ('Repair of the temple well', '0.75'), ('New bathroom', '0.75'),
    ('Renovation of cave entrance', '2.50'), ('New roof for the outer prakara, east side', '11.00'),
    ('New roof for the outer prakara, west side', '4.00'), ('New roof for the outer prakara, north side', '4.00'),
    ('New roof for the outer prakara, south side', '2.50'), ('New stairs for the Naga sannidhana', '1.50'),
    ('Suttu Pouli for the outer prakara, west side', '11.00'), ('Suttu Pouli for the outer prakara, north side', '20.00'),
    ('New Jabali sannidhana', '9.00'), ('Storeroom (west side)', '20.00'), ('Toilets (west side)', '15.00'),
    ('New function hall', '70.00'), ('Stairs for the Lord\u2019s abhisheka well', '2.00'),
    ('New rooms (for seva kartas and temple staff)', '30.00'),
]
est_rows = '\n'.join(f'            <tr><td>{e(a)}</td><td class="num">{b}</td></tr>' for a, b in ESTIMATES)
HON = [
    ('Sri Dr Mohan Alva', 'Alvas Education Foundation, Moodabidare'),
    ('Sri Kuldeep M', 'Hereditary Managing Trustee, Puttige Mahatobhara Somanatheshwara Temple, Moodabidare'),
    ('Dharmadarshi Sri Harikrishna Punarooru', 'Former President, Kannada Sahitya Parishat, Mulki'),
    ('Sri Pradeep Kumar Kalkura', 'Former President, Dakshina Kannada Sahitya Parishat, Kadri, Mangalore'),
    ('Sri Bhuvanabhirama Udupa', 'Editor, Yugapurusha, Kinnigoli'),
    ('Sri Raghavendra Achar', 'Hotel Shanti Bhavana, Bajpe'),
    ('Sri A S N Hebbar', 'Advocate, Kundapura'),
    ('Sri P Ramadas', 'ACE Manufacturing Systems, Bengaluru'),
    ('Sri Sripathi Bhat', 'Industrialist, Moodabidare'),
    ('Sri Dattatreya Guru', 'Bengaluru'),
    ('Sri Dr B S Kakkillaya', 'Prashanthi Nursing Home, Mandya'),
    ('Sri Ramaprasad', 'Hotel Udupi Garden, Kasaragod'),
    ('Sri Yajna Narayan Kammaje', 'Sona Group, Bengaluru'),
    ('Sri Sripathi Rao', 'Social Worker, Bengaluru'),
    ('Sri Vasantha Bhat', 'Mangaluru'),
    ('Sri Vadiraja Bhat', 'Managing Trustee, OSAAT, Bengaluru'),
    ('Sri Raghavendra Shastri', 'Sharavu Ganapathi Temple'),
]
MEMBERS = ['Sri Prasanna Bhat Santrabailu', 'Sri Santosh Kumar Neerude', 'Sri Ananda Kava Santrabailu',
           'Srimati Latamma Nellitheertha', 'Sri Deep Kiran Saliyan Karambaru', 'Sri N V Gopala Krishna Bhat Nellitheertha',
           'Sri Hariprasad Nellitheertha', 'Sri Satyaprasad Shibaraya Santrabailu', 'Sri Jayasheela Kotiyan Neerude',
           'Sri Janardana Gowda Kompadavu', 'Sri Hariprakash Nellitheertha', 'Sri Purandara Shetty Santrabailu',
           'Sri Bhoja Karkera Nellitheertha']
ADVISORY = ['Sri Santosh Kumar Hegde Muchur', 'Sri Jagannatha Kotian Kompadavu', 'Sri Janardana Gowda Kana Muchur',
            'Sri Krishna Prasad Omkara Katte', 'Sri Surendra Kava Kompadavu', 'Sri Ramachandra Kava Santrabailu',
            'Sri Sadashiva Shetty Mura', 'Sri Gangadhara Shetty Santrabailu', 'Sri Krishna Amin Perara',
            'Sri Satish Bandale', 'Sri Yadava Kotian Permude', 'Sri Ratnakara Shetty Yekkar', 'Sri Monappa Shetty Yekkar',
            'Sri Nitin Kava Yekkar', 'Sri Muktananda Shetty Muchur', 'Sri Shyam Shetty Yekkar',
            'Sri Divakara Poojari Yekkar', 'Sri Narasimha Shetty Muchur', 'Sri Vidyadhara Hegde Muchur',
            'Sri Appu Gowda Gurikara Kompadavu Belli Bettuguttu', 'Sri Jagannatha Chowta Manja Muchur',
            'Sri Dayananda Shetty Kaidumaru Guttu Muchur', 'Sri Hemanatha Shetty Kathelsar']
SPECIAL = ['Vedamurthi Sri Nellitheertha Srinivasa Bhat', 'Vedamurthi Sri Vasanta Bhat Nellitheertha',
           'Vedamurthi Sri Prashant Aithal, Kompadavu Sri Vishnumurthi Temple',
           'Sri Ganapati Bhat, Archakaru, Somanatheshwara Temple, Nellitheertha', 'Sri G Rajendra, Shakti Daily, Madikeri',
           'Sri Vaidyanathan, ANZ IT, Bengaluru', 'Sri N V Sripathi Bhat, Bengaluru',
           'Sri N V Ramesh Bhat, Parupattegararu, Ramanathapura Subramanya Temple', 'Sri N V Umesh Bhat, Bengaluru',
           'Sri N V Krishna Bhat, Bengaluru', 'Sri Ranganatha Rao, Bengaluru', 'Sri Dr N S Vadish Bhat, Mangaluru',
           'Sri N V Guruprasad, Bengaluru', 'Sri N G Hemanth Nellitheertha, Bengaluru', 'Sri N S Vasudev Bhat, Bengaluru',
           'Sri N S Arunkumar Bhat, Bengaluru', 'Sri Airesh Bhat, Bengaluru', 'The Archakas, Tantris and Villagers of Nellitheertha']


def names(items):
    return '\n'.join(f'          <li>{e(n)}</li>' for n in items)


hon_html = '\n'.join(f'          <li>{e(n)}<small>{e(r)}</small></li>' for n, r in HON)
write_page('appeal', 'CONTRIBUTE', 'Appeal towards temple renovation',
    'From the Renovation Committee and Executive Committee, Sri Somanatheshwara Guhalaya (Hindu Religious Institutions and Charitable Endowments Department, Government of Karnataka).',
    f'''        <p><a href="../assets/docs/appeal-2024-english.pdf">The appeal as printed, June 2024 (PDF, 2 pages)</a></p>
        <h2 id="appeal">An appeal</h2>
        <p>Dear Devotees,</p>
        <p>Amongst the numerous Tirthakshetras in Bharata, Nellitheertha holds a special and elevated status. Due to the power of the Tapas performed by Rishis and Saints, there exists the presence of Lord Shiva in the form of a Shivalinga inside a cave here. Historical records show that this place has existed under the administration of the Chowta Arasus of Moodabidare and has a recorded history of more than 700 years! An ancient Somanatheshwara temple, along with Lord Ganapati, exists here and is beautifully encroached on one side by mother nature in the form of the entrance to the cave. Till recently, this special jewel amongst the religious and spiritual places of Tulu Nadu was not so well known. However, this has changed recently.</p>
        <p>Inside the cave, at about a distance of 200 metres, there exists a beautiful pond. It is believed that Ganga, flowing via the locks of Lord Shiva, has its presence in this pond. It has been experienced that those who take bath in this pond with devotion get rid of many diseases. The soil available around the pond has medicinal properties too. Devotees take bath in the pond and then offer water on the head of the Shiva Linga that is seated in a natural pedestal. The darshana of Lord Somanatheshwara and Sage Jabali inside the cave is indeed a divine and unforgettable experience. People experience a surge in their spiritual energy when they spend time in this temple.</p>
        <p>In the recent years, due to the contributions and efforts of devotees, the renovation of the Sri Somanatheshwara temple has taken place in the years 1985, 2005 and 2014. Due to this, the inner prakara of the temple is in reasonably good shape. However, the number of devotees who are visiting the temple and taking bath inside the cave is steadily increasing, year after year. Along with this, the number of requests for conducting religious and dharmika events, including shodasha samskaras, in the temple, is going up consistently. Visitors from the district, and from other places, is showing a consistent upward trend.</p>
        <p>Due to these reasons, it has become paramount to provide basic facilities and infrastructure for visiting devotees and for the religious events that take place. In order to make these facilities possible, a committee for the repair and renovation of the temple has been constituted. The necessary plans and budget estimates for these works have been prepared and submitted to the Hindu Religious Institutions And Charitable Endowments Department, Government of Karnataka. The approval of the Government authorities have been duly obtained vide order number DVS:MSC:CR 229/2023/292129/F3 dated 21-02-2024. It has been estimated that an amount of Rupees 2.25 Crores shall be required to successfully complete all the planned works. We hope to complete the planned works within the next two years and be able to perform the Brahmakalasha rituals during 2026-2027.</p>
        <p>We request all large-hearted devotees to contribute generously to this noble cause and obtain the blessings of Lord Somanatha and Lord Ganapati.</p>
        <h2 id="estimates">Approximate estimations for the temple renovation</h2>
        <table class="data">
          <thead><tr><th scope="col">Details</th><th scope="col" class="num">Approx. (in lakhs)</th></tr></thead>
          <tbody>
{est_rows}
          </tbody>
          <tfoot><tr><td>Total estimate</td><td class="num">217.50</td></tr></tfoot>
        </table>
        <h3>Note</h3>
        <ol>
          <li>Devotees are requested to take up the financial responsibility for any of the above mentioned works in totality.</li>
          <li>It has been decided to enshrine names of people contributing more than 1 lakh on a granite stone board.</li>
          <li>The Suttu Powlis require approximately 20 stone pillars. The cost of each pillar is approximately Rs 50,000. Devotees are requested to sponsor the cost of one or more of these pillars.</li>
          <li>The cost of the rooms for seva-kartas and staff can be separately borne as well. Devotees are requested to enquire about the same in the temple office.</li>
        </ol>
        <h2 id="bank">Bank account</h2>
        <div class="bank">
          <p>Your contributions may please be credited to the following bank account.</p>
          <p><strong>Shri Somantheshwara Temple Jeernodhara Samithi</strong><br>Karnataka Bank, Aikala Branch, Dakshina Kannada<br>S.B Account Number: 0122500100786201<br>IFSC Code: KARB0000012</p>
        </div>
        <p>Kindly inform details of your contribution via email ID <a href="mailto:vbnellitheertha@yahoo.com">vbnellitheertha@yahoo.com</a> or WhatsApp number <a href="https://wa.me/918088708914">+91 80887 08914</a>.</p>
        <h2 id="guidance">Guidance and Supervision Committee</h2>
        <h3>Hon Presidents</h3>
        <ul class="names">
          <li>Sri Sri Sri Vishwaprasanna Tirtha Swamiji<small>Pejavara Adhokshaja Matha, Udupi</small></li>
          <li>Vedamurthi Sri Vasudeva Asranna<small>Hereditary Archaka, Kateel Sri Durgaparameshwari Temple</small></li>
          <li>Vedamurthi Sri Lakshmi Narayana Asranna<small>Hereditary Archaka, Kateel Sri Durgaparameshwari Temple</small></li>
        </ul>
        <h3>Hon Members</h3>
        <ul class="names">
{hon_html}
        </ul>
        <h2 id="committees">Renovation Committee</h2>
        <ul class="names">
          <li>Sri N Venkataraja Bhat, Nellitheertha<small>Treasurer</small></li>
          <li>Sri Yashwant K, Kapikad<small>Secretary</small></li>
        </ul>
        <h3>Committee Members</h3>
        <ul class="names">
{names(MEMBERS)}
        </ul>
        <h3>Advisory Committee</h3>
        <ul class="names">
{names(ADVISORY)}
        </ul>
        <h3>Special Advisors</h3>
        <ul class="names">
{names(SPECIAL)}
        </ul>''',
    'The 2024 appeal for the renovation of Sri Somanatheshwara Guhalaya, Nellitheertha: estimates, bank details and committees.')

# ---------------------------------------------------------------- how to reach
write_page('visit', 'PLAN YOUR VISIT', 'How to reach',
    'There are four routes available to reach Nellitheertha.',
    '''        <p><a class="action primary" href="https://www.google.com/maps/search/?api=1&amp;query=Sri+Somanatheshwara+Guhalaya+Nellitheertha" target="_blank" rel="noopener">Open in Maps</a></p>
        <ol class="routes">
          <li><strong>From Mangalore, by the Moodabidri road</strong>The nearest city to Nellitheertha is Mangalore (about 360 km from Bangalore). You can find a direct bus to Nellitheertha from the Mangalore Central Bus Stand. Get on to the Moodabidri road and pass through Gurupura, Kaikamba and approach Yedapadavu. Just before you reach Yedapadavu, you need to deviate to the left and travel about 8 km to reach the temple.</li>
          <li><strong>By the Mangalore to Udupi highway, through Mulki</strong>Take the Mangalore to Udupi highway and take a deviation to the right at Mulki. On that road, reach Kinnigoli and continue until you hit a V-intersection. Take the road to the left and travel 13 km to reach Nellitheertha (through Mucchur town).</li>
          <li><strong>From Bajpe, through Kathelsaar</strong>You can also reach Nellitheertha from Bajpe via Kathelsaar. This would mean you need to take the Mangalore, Bajpe, Kathelsaar, Nellitheertha road. This is actually the shortest route to Nellitheertha from Mangalore and is about 14 km shorter than the Moodabidri route.</li>
          <li><strong>From Kateel</strong>Nellitheertha is extremely close to Kateel, which is one of the most famous temples in South India. It is about 8 km from Kateel and can be reached via Ekkaru and Neerude.</li>
        </ol>
        <h2 id="before">Before you visit</h2>
        <ul>
          <li>The cave is open only between October and April.</li>
          <li>All devotees who want to enter the cave bathe in <a href="../temple/#nagappa-kere">Nagappa Kere</a> first.</li>
          <li>Any person above the age of 5 is allowed to enter the cave, irrespective of gender, belief or caste.</li>
          <li>Inside, the trail narrows: one has to bend, then crawl flat on the tummy.</li>
        </ul>
        <h2 id="contact">Contact</h2>
        <p>Sri Somanatheshwara Guhalaya (Sri Kshetra Nellitheertha)<br>Neerude Post, Kompadavu Village, Mangaluru Taluk, D.K. District<br>Karnataka, India 574144</p>
        <p>Mobile: <a href="tel:+918088708914">+91 80887 08914</a><br>Telephone: <a href="tel:+918242299142">0824 2299142</a><br>Email: <a href="mailto:vbnellitheertha@yahoo.com">vbnellitheertha@yahoo.com</a></p>''',
    'How to reach Sri Somanatheshwara Guhalaya, Nellitheertha: four routes, the address and contact numbers.')


# ---------------------------------------------------------------- Brahmakalasha 2026
# Text comes from the English invitation (reference/brahmakalasha-pdfs/invitation-digital-english-23pp.pdf),
# transcribed into _build/data/*.json, and checked against Hari's daily posters.
import datetime
import json

DATA = ROOT / '_build' / 'data'


def load(name):
    f = DATA / f'{name}.json'
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else None


def poster_files(date):
    d = datetime.date.fromisoformat(date)
    return sorted(f.name for f in (ROOT / 'assets' / 'posters').glob(f'dec{d.day}-*.webp'))


def day_label(date, weekday):
    return f'{weekday}, {datetime.date.fromisoformat(date).day} December'


def render_items(items):
    rows = []
    for it in items:
        details = ''.join(f'<span class="d">{e(x)}</span>' for x in (it.get('details') or []) if x)
        rows.append(f'            <li><span class="t">{e(it.get("time") or "")}</span>'
                    f'<span class="x">{e(it.get("text") or "")}{details}</span></li>')
    return '\n'.join(rows)


programme = load('programme')
invitation = load('invitation')
committees = load('committees')
BK = ('brahmakalasha', 'Brahmakalasha 2026')
# Decoded from the QR code on page 23 of the invitation (a signed Karnataka Bank merchant code).
UPI = ('upi://pay?pa=9986376974@kbl&pn=SRI%20SOMANATHESHWARA%20TEMPLE%20JEERNODHARA%20S&cu=INR&mc=8661&orgid=159052'
       '&sign=MEUCIQDHPf/JRbCGXygPlNo2Jh2ickx8b3OqTEgxAOU1wFuo6wIgRal+zz3RJsSpuioIKfI4gtkJgPaFw2jOJkIG2Ji+UvQ=')

if programme:
    by_date = {}
    for day in programme['days']:
        by_date.setdefault(day['date'], []).append(day)
    nav, sections = [], []
    for date, group in by_date.items():
        n = datetime.date.fromisoformat(date).day
        key = ' class="key"' if n == 25 else ''
        nav.append(f'          <li><a href="#dec-{n}"{key}><span class="dn">{n}</span>'
                   f'<span class="wd">{e(group[0]["weekday"][:3])}</span></a></li>')
        parts = [f'        <section class="day" id="dec-{n}" aria-labelledby="dec-{n}-title">',
                 f'          <h2 id="dec-{n}-title">{e(day_label(date, group[0]["weekday"]))}</h2>']
        for day in group:
            if day.get('heading'):
                parts.append(f'          <p class="day-heading">{e(day["heading"])}</p>')
            for sec in day.get('sections') or []:
                parts.append(f'          <h3>{e(sec["name"])}</h3>\n          <ol class="prog">\n'
                             f'{render_items(sec.get("items") or [])}\n          </ol>')
            for note in day.get('notes') or []:
                parts.append(f'          <p class="note">{e(note)}</p>')
        posters = poster_files(date)
        links = ' '.join(f'<a href="../assets/posters/{f}">Poster{" " + str(i + 1) if len(posters) > 1 else ""}</a>'
                         for i, f in enumerate(posters))
        parts.append(f'          <p class="poster-links">{links}</p>\n        </section>')
        sections.append('\n'.join(parts))

    instructions = ''
    if invitation and invitation.get('special_instructions'):
        li = '\n'.join(f'          <li>{e(x)}</li>' for x in invitation['special_instructions'])
        instructions = f'        <h2 id="instructions">Special instructions</h2>\n        <ol>\n{li}\n        </ol>'

    bank = ''
    if invitation and invitation.get('bank'):
        b = invitation['bank']
        lines = [x for x in (b.get('account_name'),
                             ', '.join(y for y in (b.get('bank'), b.get('branch')) if y)) if x]
        lines += [f'Account number: {b.get("account_number")}', f'IFSC: {b.get("ifsc")}']
        if b.get('upi_id'):
            lines.append(f'UPI: {b["upi_id"]}')
        qr = ''
        if (ROOT / 'assets' / 'img' / 'upi-qr.png').exists():
            qr = ('\n          <img class="qr" src="../assets/img/upi-qr.png" '
                  'alt="UPI QR code for the Sri Somanatheshwara Temple Jeernodhara Samithi account" width="863" height="867" loading="lazy">'
                  f'\n          <p><a class="action primary" href="{html.escape(UPI)}">Pay with a UPI app</a></p>')
        contact = f'\n        <p>{e(b["contact_line"])}</p>' if b.get('contact_line') else ''
        intro = f'        <p>{e(b["intro"])}</p>\n' if b.get('intro') else ''
        bank = ('        <h2 id="contribute">Contribute</h2>\n' + intro + '        <div class="bank">\n          <p>'
                + '<br>'.join(e(x) for x in lines) + f'</p>{qr}\n        </div>{contact}')

    body = '\n'.join([
        '        <dl class="keyfacts">',
        '          <div><dt>Brahmakalashabhisheka</dt><dd>Friday 25 December 2026, 10:20 AM, in Kumbha Lagna</dd></div>',
        '          <div><dt>Nagabrahma Mandalotsava</dt><dd>The night of Friday 25 December</dd></div>',
        '          <div><dt>Varshavadhi Jatre</dt><dd>25 to 30 December</dd></div>',
        '        </dl>',
        '        <p class="links-row">'
        + ('<a class="more" href="invitation/">The invitation</a>' if invitation and invitation.get('letter') else '')
        + ('<a class="more" href="committees/">Committees</a>' if committees else '')
        + '<a class="more" href="../assets/docs/brahmakalasha-invitation-english.pdf">The invitation (PDF, 23 pages)</a></p>',
        '        <h2 id="programme">Programme</h2>',
        '        <ol class="day-nav" aria-label="Days">', *nav, '        </ol>',
        *sections, instructions, bank])
    write_page('brahmakalasha', '20 TO 30 DECEMBER 2026', 'Brahmakalasha 2026',
               'Ashtabandha Brahmakalashabhisheka, Sakruth Pavitra Naga Brahma Mandalotsava and Varshavadhi Jatre '
               'at Sri Kshetra Nellitheertha.',
               body, 'The Brahmakalasha at Sri Kshetra Nellitheertha, 20 to 30 December 2026: the programme for every day.')

if invitation and invitation.get('letter'):
    L = invitation['letter']
    out = [f'        <p class="letter-head">{e(x)}</p>' for x in L.get('header_lines') or []]
    if L.get('salutation'):
        out.append(f'        <p>{e(L["salutation"])}</p>')
    for blk in L.get('blocks') or []:
        kind = blk.get('type')
        if kind == 'heading':
            out.append(f'        <h2>{e(blk.get("text") or "")}</h2>')
        elif kind == 'line':
            out.append(f'        <p class="letter-line">{e(blk.get("text") or "")}</p>')
        else:
            out.append(f'        <p>{e(blk.get("text") or "")}</p>')
    out += [f'        <p class="letter-close">{e(x)}</p>' for x in L.get('closing_lines') or []]
    out.append('        <p><a href="../../assets/docs/brahmakalasha-invitation-english.pdf">The full invitation (PDF, 23 pages)</a></p>')
    write_page('brahmakalasha/invitation', 'BRAHMAKALASHA 2026', 'The invitation', '', '\n'.join(out),
               'The invitation to the Brahmakalasha at Sri Kshetra Nellitheertha, 20 to 30 December 2026.',
               depth=2, back=('../', 'Brahmakalasha 2026'), nxt=('brahmakalasha/committees', 'Committees'))

if committees or invitation:
    out, shown = [], set()
    for g in (committees or {}).get('groups') or []:
        items = []
        for m in g.get('members') or []:
            sub = ', '.join(x for x in (m.get('role'), m.get('place')) if x)
            items.append(f'          <li>{e(m.get("name") or "")}' + (f'<small>{e(sub)}</small>' if sub else '') + '</li>')
        parent, title = g.get('parent'), g.get('title') or ''
        if parent and parent not in shown:
            out.append(f'        <h2>{e(parent)}</h2>')
            shown.add(parent)
        level = 'h3' if parent else 'h2'
        shown.add(title)
        out.append(f'        <{level}>{e(title)}</{level}>\n        <ul class="names">\n' + '\n'.join(items) + '\n        </ul>')
    if invitation and invitation.get('mahadanis'):
        items = '\n'.join(f'          <li>{e(m.get("name") or "")}'
                          + (f'<small>{e(m["detail"])}</small>' if m.get('detail') else '') + '</li>'
                          for m in invitation['mahadanis'])
        out.append(f'        <h2 id="mahadanis">Mahadanis who contributed to the Jeernoddhara</h2>\n'
                   f'        <ul class="names">\n{items}\n        </ul>')
    if invitation and invitation.get('supporters'):
        items = '\n'.join(f'          <li>{e(m.get("name") or "")}</li>' for m in invitation['supporters'])
        out.append(f'        <h2 id="supporters">Dignitaries and organisations who extended support</h2>\n'
                   f'        <ul class="names">\n{items}\n        </ul>')
    write_page('brahmakalasha/committees', 'BRAHMAKALASHA 2026', 'Committees', '', '\n'.join(out),
               'The committees, Mahadanis and supporters of the Brahmakalasha at Sri Kshetra Nellitheertha.',
               depth=2, back=('../', 'Brahmakalasha 2026'), nxt=BK)


# ---------------------------------------------------------------- the home page's routes
def splice(text, name, content):
    start, end = f'<!-- {name}:start -->', f'<!-- {name}:end -->'
    a, b = text.index(start) + len(start), text.index(end)
    return text[:a] + '\n' + content + '\n  ' + ('  ' if name == 'pages' else '') + text[b:]


home = ROOT / 'index.html'
rows = '\n'.join(
    f'        <li><a href="{s}/"><span class="page-name">{e(t)}</span><span class="page-about">{e(d)}</span></a></li>'
    for s, t, d in PAGES)
pages_section = f'''    <section class="pages" id="pages" aria-labelledby="pages-title">
      <p class="eyebrow">ABOUT NELLITHEERTHA</p>
      <h2 id="pages-title">More about the temple</h2>
      <ul class="page-index">
{rows}
      </ul>
    </section>'''
text = home.read_text(encoding='utf-8')
text = splice(text, 'pages', pages_section)
text = splice(text, 'footer', footer('').replace('<li><a href="./">Home</a></li>', '<li><a href="#top">Back to top ↑</a></li>'))
home.write_text(text, encoding='utf-8')
print('updated index.html: page list and footer')
