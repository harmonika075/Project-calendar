import { apiFetch } from './core/api-fetch'; // útvonal komponenshez képest
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import * as Sentry from '@sentry/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',   // a sablon külön fájlban van
})
export class AppComponent {
  me: { id: string; email: string; isAdmin: boolean } | null = null;

  constructor(private router: Router) {}

  async ngOnInit() {
    try {
      const res = await apiFetch('/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      this.me = res.ok ? await res.json() : null;
    } catch {
      this.me = null;
    }
  }

  async logout() {
    await apiFetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    this.router.navigateByUrl('/login');
  }

  // Sentry tesztgombhoz:
  throwError() {
    const err = new Error('Sentry verify test error (Angular)');
    Sentry.captureException(err);
    throw err;
  }
}
