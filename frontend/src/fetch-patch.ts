// frontend/src/fetch-patch.ts
// Böngésző-oldali fetch patch: a RELATÍV kérésekhez automatikusan
// beállítja a credentials: 'include'-ot. Node/SSR alatt NEM fut.

export {}; // hogy modul legyen

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url = '';

    if (typeof input === 'string') {
      url = input;
    } else if (typeof URL !== 'undefined' && input instanceof URL) {
      url = input.href;
    } else if (typeof Request !== 'undefined' && input instanceof Request) {
      url = input.url;
    }

    // Csak RELATÍV URL-ekhez adjunk sütit ("/", "./", "../")
    const isRelative = typeof url === 'string' && /^(\/|\.{1,2}\/)/.test(url);

    const merged: RequestInit = {
      ...init,
      credentials: isRelative ? 'include' : init?.credentials,
    };

    return originalFetch(input as any, merged);
  };
}
