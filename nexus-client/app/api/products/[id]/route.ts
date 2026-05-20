import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/products/[id]'>,
) {
  const { id } = await ctx.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.is_admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: true }),
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
