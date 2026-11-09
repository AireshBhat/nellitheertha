// The Brahmakalasha data, checked when the site builds: a bad edit stops the build and the live site stays as it was.
// Each text can carry a Kannada version (`kn`), read from the printed patrike and verified glyph by glyph.
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const text = z.string().min(1);
const maybe = <T extends z.ZodTypeAny>(t: T) => t.nullable().optional();

const item = z.object({
  time: z.string(),
  text,
  details: maybe(z.array(z.string())),
  kn: z.object({ time: z.string(), text: z.string(), details: z.array(z.string()) }).partial().optional(),
});
const section = z.object({ name: text, items: z.array(item), kn: z.object({ name: z.string() }).partial().optional() });
const day = z.object({
  date: z.string().regex(/^2026-12-(2\d|30)$/, 'date must be 2026-12-20 to 2026-12-30'),
  weekday: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  page: maybe(z.number()),
  heading: maybe(z.string()),
  sections: z.array(section),
  notes: maybe(z.array(z.string())),
  kn: z.object({ heading: z.string(), notes: z.array(z.string()) }).partial().optional(),
});

const person = z.object({ name: text, detail: maybe(z.string()), kn: z.object({ name: z.string(), detail: z.string() }).partial().optional() });
const invitation = z.object({
  source: maybe(z.string()),
  special_instructions: z.array(z.string()),
  bank: z.object({
    intro: maybe(z.string()), account_name: text, bank: text, branch: maybe(z.string()), account_type: maybe(z.string()),
    account_type_note: maybe(z.string()), account_number: z.string().regex(/^\d+$/), ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    upi_id: maybe(z.string()), qr_code: maybe(z.string()), contact_line: maybe(z.string()),
  }),
  letter: z.object({
    header_lines: z.array(z.string()), verse: z.array(z.string()), address_lines: z.array(z.string()), salutation: z.string(),
    blocks: z.array(z.object({ type: z.enum(['paragraph', 'heading', 'line']), text })), closing_lines: z.array(z.string()),
  }),
  mahadanis: z.array(person),
  supporters: z.array(person),
  kn: z.record(z.string(), z.unknown()).optional(),
});
const committees = z.object({
  source: maybe(z.string()),
  notes: maybe(z.array(z.string())),
  groups: z.array(z.object({
    title: text, parent: maybe(z.string()), position: maybe(z.string()), page: maybe(z.number()), numbered: maybe(z.boolean()),
    members: z.array(z.object({ name: text, role: maybe(z.string()), place: maybe(z.string()) })),
  })),
});

const whole = (id: string) => (raw: string) => [{ id, ...JSON.parse(raw) }];
export const collections = {
  programme: defineCollection({
    loader: file(process.env.PROGRAMME_FILE ?? 'src/content/programme.json', {
      // One entry per programme block, in printed order (24 December has two: the day and the stage programme).
      parser: (raw) => JSON.parse(raw).days.map((d: Record<string, unknown>, i: number) => ({ id: String(i).padStart(2, '0'), ...d })),
    }),
    schema: day,
  }),
  invitation: defineCollection({ loader: file('src/content/invitation.json', { parser: whole('invitation') }), schema: invitation }),
  committees: defineCollection({ loader: file('src/content/committees.json', { parser: whole('committees') }), schema: committees }),
};
