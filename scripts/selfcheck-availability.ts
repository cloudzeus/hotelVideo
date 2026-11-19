import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: true });
import assert from 'node:assert';

async function main() {
  const { zonedWallTimeToUtc } = await import('../src/lib/availability');
  // DST-critical: Athens is UTC+2 in winter, UTC+3 in summer.
  assert.equal(zonedWallTimeToUtc(2026, 11, 20, 9, 0).toISOString(), '2026-11-20T07:00:00.000Z', 'winter 09:00 Athens = 07:00Z');
  assert.equal(zonedWallTimeToUtc(2026, 7, 20, 9, 0).toISOString(), '2026-07-20T06:00:00.000Z', 'summer 09:00 Athens = 06:00Z');
  assert.equal(zonedWallTimeToUtc(2026, 11, 20, 0, 0).toISOString(), '2026-11-19T22:00:00.000Z', 'winter midnight Athens = 22:00Z prev day');
  console.log('selfcheck-availability OK');
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
