import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendVideoInvite } from '@/lib/video-invite';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Send an instant concierge video invite to an arbitrary email address.
// Any signed-in staff member can invite on behalf of their company.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, name } = await request.json().catch(() => ({}));
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Μη έγκυρο email' }, { status: 400 });
  }

  try {
    const { link } = await sendVideoInvite({
      email: email.trim(),
      name: typeof name === 'string' ? name.trim() : '',
      companyId: session.user.companyId,
      userId: session.user.id,
    });
    return NextResponse.json({ success: true, link });
  } catch (e) {
    console.error('video-invite email failed:', e);
    return NextResponse.json({ error: 'Η αποστολή email απέτυχε' }, { status: 502 });
  }
}
