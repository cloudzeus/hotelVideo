import crypto from 'crypto';

// shortcut: this is OUR proposed payload contract. Align field names to the hotel
// repo's actual CRM API once you share it; the receiver verifies x-hotelvideo-signature
// (HMAC-SHA256 over the raw body, hex) with HOTEL_CRM_WEBHOOK_SECRET.
export type CrmServiceRequest = {
  type: 'service_request';
  category: string;
  title: string;
  body: string;
  guest?: { email?: string; phone?: string; firstName?: string; lastName?: string };
  villaSlug?: string;
  bookingReference?: string;
  callId?: string;
  summary?: string;
};

export type CrmProfileUpdate = {
  type: 'profile_update';
  guest: { email?: string; phone?: string; firstName?: string; lastName?: string };
  fields: Record<string, string>;
  callId?: string;
};

export type CrmPayload = CrmServiceRequest | CrmProfileUpdate;

export async function postToHotelCrm(payload: CrmPayload): Promise<{ ok: boolean; status: number }> {
  const url = process.env.HOTEL_CRM_WEBHOOK_URL;
  const secret = process.env.HOTEL_CRM_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.warn('Hotel CRM webhook not configured — skipping dispatch.');
    return { ok: false, status: 0 };
  }
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hotelvideo-signature': signature },
      body,
    });
    if (!res.ok) console.error('Hotel CRM webhook rejected:', res.status);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('Hotel CRM webhook error:', err);
    return { ok: false, status: 0 };
  }
}
