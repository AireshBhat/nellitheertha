// Shared by the checks: system Chrome through playwright-core.
import { chromium } from 'playwright-core';
export const PAGES = ['', 'brahmakalasha/', 'brahmakalasha/committees/', 'brahmakalasha/invitation/', 'temple/', 'history/', 'story/',
  'cave/', 'sevas/', 'jaatre/', 'mantras/', 'gallery/', 'appeal/', 'visit/'];
export const launch = () => chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
export const base = (b) => (b.endsWith('/') ? b : b + '/');
