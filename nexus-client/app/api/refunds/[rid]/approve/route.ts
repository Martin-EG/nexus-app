import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/**
 * POST /api/refunds/[rid]/approve — approves a refund.
 *
 * Admin-only: the session is verified here, then `is_admin` and the
 * approver's `user_id` are forwarded so the Nexus API's own `require_admin`
 * check passes and the approver is recorded.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<'/api/refunds/[rid]/approve'>,
) {
  const { rid } = await ctx.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const res = await fetch(`${API_URL}/api/refunds/${rid}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_admin: true,
        user_id: session.user.user_id,
      }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the Nexus API' },
      { status: 502 },
    );
  }
}
