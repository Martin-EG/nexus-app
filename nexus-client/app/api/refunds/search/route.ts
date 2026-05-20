import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/** GET /api/refunds/search?q=... — proxies the Nexus API refund search. */
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(
      `${API_URL}/api/refunds/search${request.nextUrl.search}`,
      { cache: 'no-store' },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the Nexus API' },
      { status: 502 },
    );
  }
}
