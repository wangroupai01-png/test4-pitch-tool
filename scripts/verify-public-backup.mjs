import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const path = new URL('../backups/public-content-2026-09-15.json', import.meta.url);
const contents = await readFile(path);
const backup = JSON.parse(contents.toString('utf8'));
const expected = { skills: 12, lessons: 51, level_config: 24, achievements: 30 };

for (const [table, count] of Object.entries(expected)) {
  if (!Array.isArray(backup.tables?.[table]) || backup.tables[table].length !== count) {
    throw new Error(`${table} count mismatch`);
  }
}

const serialized = contents.toString('utf8');
for (const forbidden of ['access_token', 'refresh_token', 'password', 'user_id']) {
  if (serialized.toLowerCase().includes(forbidden)) throw new Error(`sensitive field found: ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  counts: expected,
  sha256: createHash('sha256').update(contents).digest('hex'),
}));
