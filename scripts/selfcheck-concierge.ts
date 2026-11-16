import assert from 'node:assert';
import { parseAnalysis } from '../src/lib/openrouter';

// service_request extraction
const sr = parseAnalysis(JSON.stringify({
  summary: 'Guest wants extra towels',
  intent: 'service_request',
  serviceRequest: { category: 'HOUSEKEEPING', title: 'Extra towels', body: 'Two bath towels to villa 3' },
}));
assert.equal(sr.intent, 'service_request');
assert.equal(sr.serviceRequest?.category, 'HOUSEKEEPING');

// unknown category falls back to OTHER
const bad = parseAnalysis(JSON.stringify({ summary: 's', intent: 'service_request', serviceRequest: { category: 'NOPE', title: 't', body: 'b' } }));
assert.equal(bad.serviceRequest?.category, 'OTHER');

// profile_update
const pu = parseAnalysis(JSON.stringify({ summary: 's', intent: 'profile_update', profileUpdate: { dietary: 'vegan' } }));
assert.equal(pu.intent, 'profile_update');
assert.equal(pu.profileUpdate?.dietary, 'vegan');

// invalid intent + malformed JSON → none, no throw
assert.equal(parseAnalysis(JSON.stringify({ summary: 's', intent: 'weird' })).intent, 'none');
assert.equal(parseAnalysis('not json').intent, 'none');

console.log('✅ parseAnalysis self-check passed');
