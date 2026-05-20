import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/** GET /api/sales/by-user/[uid] — proxies a user's completed sales. */
export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/sales/by-user/[uid]'>,
) {
  const { uid } = await ctx.params;
  try {
    const res = await fetch(`${API_URL}/api/sales/by-user/${uid}`, {
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
