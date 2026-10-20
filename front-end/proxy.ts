import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = '4v4-locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function preferredLocale(request: NextRequest) {
  const languages = (request.headers.get('accept-language') ?? '')
    .split(',')
    .map((entry, index) => {
      const [language, qualityValue] = entry.trim().split(';q=');
      return { language: language.toLowerCase().split('-')[0], quality: qualityValue ? Number(qualityValue) : 1, index };
    })
    .filter(({ language, quality }) => ['en', 'es', 'pt'].includes(language) && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return languages[0]?.language ?? 'en';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;

  const localePrefix = pathname.match(/^\/(es|pt)(?:\/|$)/)?.[1];
  if (localePrefix) {
    const internalPath = pathname === `/${localePrefix}` ? '/' : pathname.slice(localePrefix.length + 1);
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPath;
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set(LOCALE_COOKIE, localePrefix, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' });
    return response;
  }

  const locale = localeCookie === 'en' || localeCookie === 'es' || localeCookie === 'pt'
    ? localeCookie
    : preferredLocale(request);

  if (locale !== 'en') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
