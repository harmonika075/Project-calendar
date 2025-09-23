// Globális fetch patch: a RELATÍV ("/...") kérésekhez alapból 'include' legyen a credentials.

const _fetch = globalThis.fetch.bind(globalThis);

// Segéd: stringgé alakítjuk az inputot, és levágjuk a {http(s)://localhost:... | onrender backend} előtagot
function normalizeUrl(input: RequestInfo | URL): string | RequestInfo | URL {
  if (typeof input === 'string') {
    return input
      .replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/)/, '')
      .replace(/^https:\/\/project-calendar-5yo4\.onrender\.com(?=\/)/, '');
  }
  if (input instanceof URL) {
    const s = input.href
      .replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/)/, '')
      .replace(/^https:\/\/project-calendar-5yo4\.onrender\.com(?=\/)/, '');
    return s || input;
  }
  return input;
}

globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const normalized = normalizeUrl(input);
  // Csak a RELATÍV URL-ekhez ("/", "./", "../") adjunk sütit automatikusan
  const urlStr = typeof normalized === 'string' ? normalized : normalized instanceof URL ? normalized.href : '';
  const isRelative = typeof urlStr === 'string' && (/^(\/|\.{1,2}\/)/.test(urlStr));

  const mergedInit: RequestInit = {
    ...init,
    credentials: isRelative ? 'include' : init?.credentials,
  };

  return _fetch(normalized as any, mergedInit);
};
