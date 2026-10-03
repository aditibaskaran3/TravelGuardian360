// Fills src/i18n/locales/<code>.json for every string in scripts/keys.json.
// Usage: node scripts/extract-keys.cjs && node scripts/translate-locales.mjs [code ...]
// Existing translations are kept, so the script only fetches what is missing. Review the output before shipping.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const LOCALES = join(here, '..', 'src', 'i18n', 'locales');
const TARGETS = { hi: 'hi', ta: 'ta', te: 'te', mr: 'mr', es: 'es', fr: 'fr', de: 'de', ja: 'ja', zh: 'zh-CN', ru: 'ru' };
const keys = JSON.parse(readFileSync(join(here, 'keys.json'), 'utf8'));
const only = process.argv.slice(2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// {name} placeholders become numbers, which survive translation and can be reordered by the translator.
function protect(text) {
  const names = [];
  const masked = text.replace(/\{(\w+)\}/g, (_, name) => {
    if (!names.includes(name)) names.push(name);
    return String(9001 + names.indexOf(name));
  });
  return { masked, names };
}

function restore(text, names) {
  let out = text;
  names.forEach((name, i) => {
    out = out.split(String(9001 + i)).join(`{${name}}`);
  });
  return names.every((_, i) => text.includes(String(9001 + i))) ? out : null;
}

class RateLimited extends Error {}

async function request(text, lang) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.search = new URLSearchParams({ client: 'gtx', sl: 'en', tl: lang, dt: 't', q: text }).toString();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const res = await fetch(url).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return data[0].map((part) => part[0]).join('');
    }
    // 429: the service asked us to slow down, so wait longer each time.
    await sleep(res && res.status === 429 ? 45000 * (attempt + 1) : 1000 * (attempt + 1));
  }
  throw new RateLimited('translation service unavailable');
}

// Several strings per request (one per line) keeps the request count low.
async function translateBatch(texts, lang) {
  const masked = texts.map(protect);
  const joined = await request(masked.map((m) => m.masked).join('\n'), lang);
  const lines = joined.split('\n');
  if (lines.length !== texts.length) return null;
  return lines.map((line, i) => (masked[i].names.length ? restore(line, masked[i].names) : line));
}

async function translateOne(text, lang) {
  const { masked, names } = protect(text);
  const out = await request(masked, lang);
  return names.length ? restore(out, names) : out;
}

for (const [code, api] of Object.entries(TARGETS)) {
  if (only.length && !only.includes(code)) continue;
  const file = join(LOCALES, `${code}.json`);
  const dict = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const missing = keys.filter((k) => dict[k] === undefined);
  let failed = 0;
  const BATCH = 12;
  try {
    for (let i = 0; i < missing.length; i += BATCH) {
      const chunk = missing.slice(i, i + BATCH);
      let results = await translateBatch(chunk, api);
      if (!results) results = await Promise.all(chunk.map((k) => translateOne(k, api).catch(() => null)));
      chunk.forEach((key, j) => {
        if (results[j] && results[j].trim()) dict[key] = results[j];
        else failed += 1;
      });
      writeFileSync(file, `${JSON.stringify(dict, null, 1)}\n`);
      await sleep(1500);
    }
  } catch (err) {
    console.log(`${code}: stopped (${err.message}); run the script again later to continue`);
  }
  const sorted = Object.fromEntries(Object.keys(dict).sort().map((k) => [k, dict[k]]));
  writeFileSync(file, `${JSON.stringify(sorted, null, 1)}\n`);
  console.log(`${code}: ${missing.length - failed}/${missing.length} translated${failed ? `, ${failed} left in English` : ''}`);
}
