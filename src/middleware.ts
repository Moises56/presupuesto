import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authjs.session-token')?.value 
    || request.cookies.get('__Secure-authjs.session-token')?.value;
  
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth');
  const isPublicAsset = request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|ico|svg)$/);

  // Permitir acceso a la API de autenticación y assets públicos
  if (isAuthApi || isPublicAsset) {
    return NextResponse.next();
  }

  // Si no está logueado y no está en login, redirigir a login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si está logueado y está en login, redirigir a home
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg).*)'],
};
