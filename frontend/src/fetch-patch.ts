// frontend/src/fetch-patch.ts
// Böngésző-oldali fetch patch:
// - RELATÍV kéréseknél és a backend API abszolút URL-jénél automatikusan
//   beállítja a credentials: 'include'-ot.
// Node/SSR alatt nem fut.

import { environment } from './environments/environment';

export {}; // hogy modul legyen

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const API_ORIGIN = originOf(environment.apiBaseUrl || '');

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

    const isRelative = typeof url === 'string' && /^(\/|\.{1,2}\/)/.test(url);
    const isBackendAbs =
      typeof url === 'string' &&
      API_ORIGIN !== null &&
      originOf(url) === API_ORIGIN;

    const merged: RequestInit = {
      ...init,
      credentials: (isRelative || isBackendAbs) ? 'include' : init?.credentials,
    };

    return originalFetch(input as any, merged);
  };
}
