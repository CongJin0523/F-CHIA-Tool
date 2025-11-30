export const LINK_WHITELIST = [
  "iso.org",
  "webstore.iec.ch",
  "bsigroup.com",
  "ansi.org",
  "techstreet.com",
  "din.de",
  "sis.se",
  "standards.iteh.ai",
  "cen.eu",
  "cenelec.eu",
  "etsi.org",
  "en-standard.eu",
];

export type ResultItem = {
  iso_number: string;
  title: string;
  reason: string;
  links: string[];
};