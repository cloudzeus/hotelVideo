import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getIntegrationConfig } from '@/lib/integration-config';
import { generateStreamUserToken } from '@/lib/stream-token';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stream } = await getIntegrationConfig();
    if (!stream.apiKey || !stream.secret) {
      return NextResponse.json({ error: 'Stream is not configured' }, { status: 500 });
    }

    const { callId } = await request.json();

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    // Verify the user has access to this meeting
    const meeting = await prisma.call.findFirst({
      where: {
        id: callId,
        OR: [
          { createdById: session.user.id },
          { participants: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        participants: true
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found or access denied' }, { status: 404 });
    }

    const token = generateStreamUserToken(session.user.id, stream.apiKey, stream.secret);

    return NextResponse.json({
      token,
      apiKey: stream.apiKey,
      userId: session.user.id,
      userName: `${session.user.firstName} ${session.user.lastName}`,
      callId: callId,
    });

  } catch (error) {
    console.error('Error generating Stream Video token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
