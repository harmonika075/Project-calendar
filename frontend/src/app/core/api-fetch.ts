// frontend/src/app/core/api-fetch.ts
import { apiUrl } from './api-url';

/**
 * fetch wrapper:
 * - a path-ot API abszolút URL-lé alakítja
 * - automatikusan beállítja a credentials: 'include'-t
 * - NEM írja felül a meglévő headereket
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  const headers = new Headers(init?.headers || {});
  return fetch(url, {
    ...init,
    headers,
    credentials: 'include', // sütis auth-hoz kell
  });
}

/** GET -> JSON */
export async function apiGetJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** POST JSON -> JSON/empty */
export async function apiPostJson<T = unknown>(path: string, body: any): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : (undefined as T));
}

/** PUT/PATCH/DELETE ha kell, ugyanilyen mintára tudsz még csinálni */
