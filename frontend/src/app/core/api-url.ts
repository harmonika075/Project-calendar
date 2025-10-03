// frontend/src/app/core/api-url.ts
import { environment } from '../../environments/environment';

/**
 * Mindig abszolút API URL-t ad vissza.
 * - Ha a path már abszolút (http/https), VÁLTOZATLANUL visszaadjuk.
 * - Egyébként hozzátesszük az environment.apiBaseUrl-t.
 * - Türi a duplacsíkokat is, nem dupláz.
 */
export function apiUrl(path: string): string {
  if (!path) return environment.apiBaseUrl;

  // Ha már abszolút URL
  if (/^https?:\/\//i.test(path)) return path;

  const base = (environment.apiBaseUrl || '').replace(/\/+$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}
