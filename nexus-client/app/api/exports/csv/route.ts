import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/**
 * GET /api/exports/csv — admin-only CSV export.
 *
 * The session is verified here, then `is_admin=true` is forwarded so the
 * Nexus API's own `require_admin` check (run against the query string)
 * passes.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const params = new URLSearchParams(request.nextUrl.search);
  params.set('is_admin', 'true');

  try {
    const res = await fetch(`${API_URL}/api/exports/csv?${params.toString()}`, {
      cache: 'no-store',
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
