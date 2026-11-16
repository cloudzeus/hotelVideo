import { createHmac } from 'crypto';

// Mints a Stream Video JWT for a user id (HS256, signed with STREAM_SECRET).
export function generateStreamUserToken(userId: string, ttlSec = 24 * 60 * 60): string {
  const key = process.env.STREAM_API_KEY;
  const secret = process.env.STREAM_SECRET;
  if (!key || !secret) throw new Error('STREAM_API_KEY and STREAM_SECRET are required');

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ user_id: userId, iat: now, exp: now + ttlSec, iss: key }),
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}
