// The Kannada for the English text that has no Kannada from the patrike.
// Every page passes through addKannada (src/middleware.ts). It finds each piece of English text, a "unit": the
// smallest element whose own text has words. If src/content/kn-site.json has Kannada for that unit's English, its
// contents become <span class="en-only">English</span><span class="kn-only" lang="kn">Kannada</span>, and the
// language switch shows one of the two (styles: .en-only, .kn-only). English with no entry stays as it is.
// Plain TypeScript, so scripts/kn-missing.ts can list what is still English.
import { parse } from 'parse5';

export interface KnEntry { kn: string; from: string }
export type KnDict = Record<string, KnEntry>;
export interface Unit { start: number; end: number; html: string; key: string; tag: string }

// Elements whose text is not translated: code, and what already has a language or a script of its own.
const SKIP_TAGS = new Set(['head', 'script', 'style', 'svg', 'noscript', 'template', 'code', 'pre', 'textarea']);
const WORDS = /[A-Za-z]{2,}/;

/** The dictionary key for a unit: its inner HTML with the whitespace collapsed. */
export const keyOf = (html: string) => html.replace(/\s+/g, ' ').trim();

// parse5's tree, as much of it as is read here.
interface Attr { name: string; value: string }
interface Loc { startOffset: number; endOffset: number }
interface Node {
  nodeName: string; tagName?: string; value?: string; attrs?: Attr[]; childNodes?: Node[];
  sourceCodeLocation?: { startTag?: Loc; endTag?: Loc };
}

function skipped(el: Node): boolean {
  if (SKIP_TAGS.has(el.tagName ?? '')) return true;
  for (const a of el.attrs ?? []) {
    if (a.name === 'lang' && !a.value.startsWith('en')) return true; // already Kannada
    if (a.name === 'data-kn' || a.name === 'data-live' || a.name === 'data-no-kn') return true; // switched by a script, or kept English on purpose
    if (a.name === 'translate' && a.value === 'no') return true;
    if (a.name === 'class' && /(^|\s)(kn-only|en-only)(\s|$)/.test(a.value)) return true; // has its Kannada already
  }
  return false;
}

const ownText = (el: Node) => (el.childNodes ?? []).some((n) => n.nodeName === '#text' && WORDS.test(n.value ?? ''));

/** Every unit on a page, in document order. */
export function units(html: string): Unit[] {
  const doc = parse(html, { sourceCodeLocationInfo: true }) as unknown as Node;
  const out: Unit[] = [];
  const walk = (el: Node) => {
    if (el.tagName && skipped(el)) return;
    if (el.tagName && ownText(el)) {
      const loc = el.sourceCodeLocation;
      if (loc?.startTag && loc.endTag) {
        const inner = html.slice(loc.startTag.endOffset, loc.endTag.startOffset);
        out.push({ start: loc.startTag.endOffset, end: loc.endTag.startOffset, html: inner, key: keyOf(inner), tag: el.tagName });
      }
      return;
    }
    for (const c of el.childNodes ?? []) if (c.tagName || c.nodeName === '#document' || c.nodeName === 'html') walk(c);
  };
  walk(doc);
  return out;
}

/** The page with Kannada beside every unit that has an entry. */
export function addKannada(html: string, dict: KnDict): string {
  let out = '';
  let at = 0;
  for (const u of units(html)) {
    const entry = dict[u.key];
    if (!entry || entry.kn === u.key) continue; // no Kannada yet, or nothing to translate (an email, a code)
    out += html.slice(at, u.start) + `<span class="en-only">${u.html}</span><span class="kn-only" lang="kn">${entry.kn}</span>`;
    at = u.end;
  }
  return out + html.slice(at);
}
