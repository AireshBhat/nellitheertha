# Sri Kshetra Nellitheertha website

The website of Sri Somanatheshwara Guhalaya (Sri Somanatheshwara Cave Temple), Sri Kshetra Nellitheertha, Kompadavu Village, Mangaluru Taluk, Karnataka.

This is a **preview**. It is live at https://nellitheertha.vercel.app (and at nellitheertha.in once the domain is active). Search engines are asked not to index it.

## What is here

- `index.html`: the home page.
- `brahmakalasha/`: the Brahmakalasha, 20 to 30 December 2026. The day-by-day programme, the invitation, and the committees and supporters.
- `temple/`, `history/`, `story/`, `cave/`, `sevas/`, `jaatre/`, `mantras/`, `gallery/`, `appeal/`, `visit/`: content ported from the earlier nellitheerthatemple.in.
- `styles.css`, `script.js`: the shared styles and the home page's behaviour.
- `assets/`: images, the daily posters, fonts and documents.
- `_build/pages.py`: writes the content pages and the home page's page list and footer. The Brahmakalasha text is in `_build/data/*.json`, transcribed from the English invitation.

## Changing the site

Edit the text in `_build/pages.py` or `_build/data/*.json`, then run:

```sh
python3 _build/pages.py
```

Commit and push to `main`. Vercel deploys every push to `main`.

## Sources and credits

- **Text:** the temple's earlier website, the 2024 renovation appeal and the 2026 Brahmakalasha invitation.
- **Photographs:** the temple's own, from 2023, plus photographs from the first nellitheertha.com website, some marked © K.B. Mallya.
- **Pictures made with AI:** the forest, the forest walk, the kere and the cave were made with AI from photographs and footage of Nellitheertha. The sanctum picture on the home page is a real video frame restored with AI.
- **Fonts:** Tiro Kannada and Anek Kannada, under the SIL Open Font License (licence files in `assets/fonts/`).
