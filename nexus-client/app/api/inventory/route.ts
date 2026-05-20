import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/** GET /api/inventory — proxies the Nexus API inventory overview. */
export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/inventory`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the Nexus API' },
      { status: 502 },
    );
  }
}
