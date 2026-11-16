import OpenAI from 'openai';
import { getIntegrationConfig } from '@/lib/integration-config';

// OpenRouter does ONLY the LLM step (summary + intent extraction) on a transcript
// that Stream.io already produced. It has no ASR — never send it audio/video.

export type SRCategory =
  | 'HOUSEKEEPING' | 'MAINTENANCE' | 'FOOD_BEVERAGE' | 'TRANSPORT' | 'CONCIERGE' | 'OTHER';

export type ConciergeAnalysis = {
  summary: string;
  intent: 'service_request' | 'profile_update' | 'none';
  serviceRequest?: { category: SRCategory; title: string; body: string };
  // flat map of guest-profile fields to update, e.g. { dietary: 'vegan', transfer: 'airport 14:00' }
  profileUpdate?: Record<string, string>;
};

const CATEGORIES: SRCategory[] = ['HOUSEKEEPING', 'MAINTENANCE', 'FOOD_BEVERAGE', 'TRANSPORT', 'CONCIERGE', 'OTHER'];

const SYSTEM = `You analyze a transcript of a hotel/villa remote-concierge video call.
Decide if the guest is (a) requesting a service, (b) sharing profile/preference info to store, or (c) neither.
Return STRICT JSON only, no prose, with this shape:
{
  "summary": string,                         // concise summary, in the requested language
  "intent": "service_request" | "profile_update" | "none",
  "serviceRequest": { "category": one of ${CATEGORIES.join('|')}, "title": string, "body": string } | null,
  "profileUpdate": { "<field>": "<value>", ... } | null
}`;

export async function analyzeConciergeTranscript(
  transcript: string,
  language = 'en',
): Promise<ConciergeAnalysis> {
  const { openrouter: or } = await getIntegrationConfig();
  if (!or.apiKey) {
    console.warn('OpenRouter API key not set — skipping concierge analysis.');
    return { summary: '', intent: 'none' };
  }
  const client = new OpenAI({ apiKey: or.apiKey, baseURL: 'https://openrouter.ai/api/v1' });
  const res = await client.chat.completions.create({
    model: or.model || 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: `${SYSTEM}\nWrite "summary" in language: ${language}.` },
      { role: 'user', content: transcript },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });
  return parseAnalysis(res.choices[0]?.message?.content ?? '{}');
}

// Exported for the self-check script (scripts/selfcheck-concierge.mjs).
export function parseAnalysis(raw: string): ConciergeAnalysis {
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    const intent = j.intent === 'service_request' || j.intent === 'profile_update' ? j.intent : 'none';
    const sr = j.serviceRequest as ConciergeAnalysis['serviceRequest'] | null | undefined;
    const serviceRequest =
      intent === 'service_request' && sr && typeof sr.title === 'string'
        ? { category: CATEGORIES.includes(sr.category) ? sr.category : 'OTHER', title: sr.title, body: String(sr.body ?? '') }
        : undefined;
    const pu = j.profileUpdate;
    const profileUpdate =
      intent === 'profile_update' && pu && typeof pu === 'object' ? (pu as Record<string, string>) : undefined;
    return { summary: String(j.summary ?? ''), intent, serviceRequest, profileUpdate };
  } catch {
    return { summary: raw.slice(0, 500), intent: 'none' };
  }
}
