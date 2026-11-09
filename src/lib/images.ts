import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

// A srcset of one picture in one format, at the given widths (never wider than the source).
export async function srcset(src: ImageMetadata, widths: number[], format: 'avif' | 'webp'): Promise<string> {
  const use = [...new Set([...widths.filter((w) => w < src.width), src.width].filter((w) => w <= src.width))].sort((a, b) => a - b);
  const done = await Promise.all(use.map((width) => getImage({ src, width, format })));
  return done.map((img, i) => `${img.src} ${use[i]}w`).join(', ');
}

export const TALL_WIDTHS = [480, 720, 960];
export const WIDE_WIDTHS = [960, 1400, 1920, 2400];
