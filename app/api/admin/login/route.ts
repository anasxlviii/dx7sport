export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';



export async function POST(request: Request) {
  const { username, password } = await request.json();

  const adminUser = process.env.ADMIN_USERNAME || 'anas';
  const adminPass = process.env.ADMIN_PASSWORD || '';

  if (username?.trim().toLowerCase() === adminUser.toLowerCase() && password?.trim() === adminPass) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
