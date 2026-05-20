import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/** GET /api/notifications/[id] — proxies a user's notifications. */
export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/notifications/[id]'>,
) {
  const { id } = await ctx.params;
  try {
    const res = await fetch(`${API_URL}/api/notifications/${id}`, {
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

/** DELETE /api/notifications/[id] — proxies deleting a notification. */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/notifications/[id]'>,
) {
  const { id } = await ctx.params;
  try {
    const res = await fetch(`${API_URL}/api/notifications/${id}`, {
      method: 'DELETE',
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
