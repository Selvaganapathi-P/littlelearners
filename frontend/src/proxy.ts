import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STAFF_PATHS = ['/studio', '/calendar'];
const ADMIN_PATHS = ['/founder'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('ll_token')?.value;

  const needsStaff = STAFF_PATHS.some(p => pathname.startsWith(p));
  const needsAdmin = ADMIN_PATHS.some(p => pathname.startsWith(p));

  if ((needsStaff || needsAdmin) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/calendar/:path*', '/founder/:path*'],
};
