import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  try {
    const res = await fetch(
      `${API_URL}/api/products/search?q=${encodeURIComponent(q)}`,
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
