// The Kannada the home page's live panel writes (src/scripts/home.ts and its first state in src/pages/index.astro).
// Times and dates follow the patrike: "ಬೆಳಗ್ಗೆ 6:00", "ಮಧ್ಯಾಹ್ನ 1:30", "ಸಂಜೆ 5:00", "ರಾತ್ರಿ 8:00"; weekdays ಭಾನುವಾರ ...
// Set by hand (2026-11-14), to be checked by a Kannada reader with the rest of the machine translation.

export const WEEKDAY_KN: Record<string, string> = {
  Sunday: 'ಭಾನುವಾರ', Monday: 'ಸೋಮವಾರ', Tuesday: 'ಮಂಗಳವಾರ', Wednesday: 'ಬುಧವಾರ',
  Thursday: 'ಗುರುವಾರ', Friday: 'ಶುಕ್ರವಾರ', Saturday: 'ಶನಿವಾರ',
};

/** "ಡಿಸೆಂಬರ್ 25, ಶುಕ್ರವಾರ" for 2026-12-25. */
export const dateKn = (date: string, weekday: string) => `ಡಿಸೆಂಬರ್ ${Number(date.slice(8))}, ${WEEKDAY_KN[weekday] ?? weekday}`;

/** The part of the day and the clock, as the patrike prints them: ['ಬೆಳಗ್ಗೆ', '10:20']. */
export function clockKn(m: number): [string, string] {
  const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
  const part = h >= 5 && h < 12 ? 'ಬೆಳಗ್ಗೆ' : h >= 12 && h < 16 ? 'ಮಧ್ಯಾಹ್ನ' : h >= 16 && h < 20 ? 'ಸಂಜೆ' : 'ರಾತ್ರಿ';
  return [part, `${(h % 12) || 12}:${mm}`];
}

/** A programme time label: "ಬೆಳಗ್ಗೆ 6:00", or "ಬೆಳಗ್ಗೆ" for the English "Morning". */
export const timeKn = (m: number | null, label: string) => (m !== null ? clockKn(m).join(' ') : label === 'Morning' ? 'ಬೆಳಗ್ಗೆ' : label);

export const KN = {
  day: 'ದಿನ',
  days: 'ದಿನಗಳು',
  next: 'ಮುಂದಿನದು',
  poster: 'ಪೋಸ್ಟರ್',
  firstLine: 'ಕಾರ್ಯಕ್ರಮಗಳು ಡಿಸೆಂಬರ್ 20, ಭಾನುವಾರ ಆರಂಭವಾಗುತ್ತವೆ.',
  beginsTomorrow: 'ಕಾರ್ಯಕ್ರಮಗಳು ನಾಳೆ, ಡಿಸೆಂಬರ್ 20, ಭಾನುವಾರ ಆರಂಭವಾಗುತ್ತವೆ.',
  beginsIn: (n: number) => `ಕಾರ್ಯಕ್ರಮಗಳು ಡಿಸೆಂಬರ್ 20, ಭಾನುವಾರ ಆರಂಭವಾಗುತ್ತವೆ, ಇನ್ನು ${n} ${n === 1 ? 'ದಿನ' : 'ದಿನಗಳು'}.`,
  dayOf: (i: number, n: number) => `ಬ್ರಹ್ಮಕಲಶ 2026 · ${n} ದಿನಗಳಲ್ಲಿ ${i}ನೇ ದಿನ`,
  today: (d: string) => `ಇಂದು, ${d}`,
  todayEyebrow: (d: string) => `ಇಂದು · ${d}`,
  tomorrow: (d: string) => `ನಾಳೆ, ${d}`,
  since: (t: string) => `${t}ರಿಂದ`,
  keyIn: (n: number) => `ಬ್ರಹ್ಮಕಲಶಾಭಿಷೇಕ: ಡಿಸೆಂಬರ್ 25, ಶುಕ್ರವಾರ, ಬೆಳಗ್ಗೆ 10:20, ಇನ್ನು ${n} ${n === 1 ? 'ದಿನ' : 'ದಿನಗಳು'}.`,
  keyTomorrow: 'ಬ್ರಹ್ಮಕಲಶಾಭಿಷೇಕ: ನಾಳೆ, ಡಿಸೆಂಬರ್ 25, ಶುಕ್ರವಾರ, ಬೆಳಗ್ಗೆ 10:20ಕ್ಕೆ ಕುಂಭ ಲಗ್ನದಲ್ಲಿ.',
  jatre: 'ವರ್ಷಾವಧಿ ಜಾತ್ರೆ ಡಿಸೆಂಬರ್ 25ರಿಂದ 30ರವರೆಗೆ.',
  copied: 'ಖಾತೆ ಸಂಖ್ಯೆಯನ್ನು ನಕಲಿಸಲಾಗಿದೆ',
  selectAndCopy: (n: string) => `ಆಯ್ಕೆಮಾಡಿ ನಕಲಿಸಿ: ${n}`,
};
