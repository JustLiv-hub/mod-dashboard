import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = new Set<string>([
  '/mod/login',
  '/favicon.ico',
]);

async function isAuthed(token: string | undefined) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload?.role === 'mod';
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // only guard /mod/* except /mod/login
  if (!pathname.startsWith('/mod') || PUBLIC.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('mod_auth')?.value;
  if (await isAuthed(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/mod/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/mod/:path*'],
};
