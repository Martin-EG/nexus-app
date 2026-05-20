import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/** POST /api/notifications/[id]/read — marks a notification as read. */
export async function POST(
  _request: Request,
  ctx: RouteContext<'/api/notifications/[id]/read'>,
) {
  const { id } = await ctx.params;
  try {
    const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'POST',
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
