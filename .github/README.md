# Sri Kshetra Nellitheertha website

The website of Sri Somanatheshwara Guhalaya (Sri Somanatheshwara Cave Temple), Sri Kshetra Nellitheertha, Kompadavu Village, Mangaluru Taluk, Karnataka. It is live at https://nellitheertha.in.

It is built with [Astro](https://astro.build) as a static site. Vercel builds and deploys every push to `main`, and every other branch gets a preview.

## What is here

- `src/pages/`: one file per page. The home page is `index.astro`; `brahmakalasha/` has the programme, the invitation, and the committees and supporters.
- `src/content/`: the Brahmakalasha data.
  - `programme.json` is the day-by-day programme; `invitation.json` holds the instructions, bank details, letter, Mahadanis and supporters; `committees.json` holds the committees.
  - The English comes from the English invitation. The `kn` fields hold the Kannada from the printed patrike, shown when ಕನ್ನಡ is chosen.
  - `src/content.config.ts` checks this data when the site builds, and `src/lib/brahmakalasha.ts` checks the programme as a whole. A bad edit stops the build, so the live site stays on its last good version.
- `src/components/`, `src/layouts/`: the shared header, footer and page layout.
- `src/scripts/home.ts`: the home page's live panel (a countdown to the Brahmakalasha whose number rolls in with [NumberFlow](https://github.com/barvian/number-flow), then today's programme with now and next, in Indian time) and the forest walk. `src/scripts/site.ts`: the language switch and the arrow back to the top.
- `public/`: files served as they are, at fixed addresses. These are the pictures, the posters, the PDFs, the share image, the UPI code, the icons and the forest-walk frames. The pictures and the walk frames are the approved files, byte for byte; `tests/walk-parity.mjs` compares them with the earlier site.
- `scripts/`: the tools that made some files.
  - `fonts.py` cuts the fonts.
  - `merge-kannada.py` brings the verified Kannada into `src/content/`.
- `tests/`: checks run in Chrome against a built copy.

## Changing the site

```sh
pnpm install
pnpm dev        # a local copy at http://localhost:4321
pnpm build      # the site, in dist/
pnpm preview    # serve dist/ at http://localhost:4321
```

To change the programme, edit `src/content/programme.json` and run `pnpm build`. If the build fails, the message names the entry and the field.

To see the home page's live panel as it will be at a given moment in Indian time, add `?now=2026-12-25T09:00` to the address.

## Checks

Build, run `pnpm preview`, then run the checks you need. Most compare against the earlier site (BASE_OLD) or need only the new one (BASE).

| Check | What it covers |
|---|---|
| `tests/build.sh`, `tests/schema.sh` | The site builds, and bad programme data stops the build |
| `tests/parity.mjs BASE_OLD BASE` | Same words, no overflow, no broken pictures or errors on every page |
| `tests/head.mjs BASE --compare tests/head.live.json` | Titles, descriptions, share tags and event data |
| `tests/live.mjs BASE --compare tests/live.live.json` | The live panel at 13 moments, including a phone set to another timezone |
| `tests/countdown.mjs BASE` | The countdown's number rolls down once, when it comes into view, never with reduced motion; screen readers read the true number |
| `tests/urls.mjs BASE_OLD BASE` | Every earlier address still answers |
| `tests/nojs.mjs BASE`, `tests/failed-script.mjs BASE` | Every page reads without JavaScript, or when a script fails to arrive |
| `tests/kannada.mjs BASE`, `tests/glyphs.mjs BASE_OLD BASE` | The Kannada versions, and that Kannada renders the same as before |
| `tests/weight.mjs BASE`, `tests/slow.mjs BASE`, `tests/anchor.mjs BASE`, `tests/frames.mjs BASE_OLD BASE` | What a phone downloads, the forest walk on a slow link, and cached frames |
| `tests/walk-parity.mjs BASE_OLD BASE` | The forest walk and every home-page picture look as on the earlier site |
| `tests/axe.mjs BASE [kn]`, `tests/upi.mjs BASE_OLD BASE`, `tests/public.sh` | Accessibility, the UPI link, and no internal notes in this public repository |

## Sources and credits

- **Text:** the temple's earlier website, the 2024 renovation appeal, and the 2026 Brahmakalasha invitation and patrike.
- **Photographs:** the temple's own, from 2023, plus photographs from the first nellitheertha.com website, some marked © K.B. Mallya.
- **Pictures made with AI:** the forest, the forest walk, the kere and the cave were made with AI from photographs and footage of Nellitheertha. The sanctum picture on the home page is a real video frame restored with AI.
- **Fonts:** Tiro Kannada and Anek Kannada, under the SIL Open Font License (`src/fonts/*-OFL.txt`).
