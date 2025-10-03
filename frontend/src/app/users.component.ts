import { apiFetch } from './core/api-fetch'; // útvonal komponenshez képest
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type User = { id: string; email: string; createdAt: string };

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule],
  styles: [`
    .wrap { padding:24px; max-width:820px; }
    form { display:grid; gap:12px; grid-template-columns: 1fr 1fr auto; align-items:end; margin:12px 0 20px; }
    label { font-size:12px; color:#555; display:block; margin-bottom:4px; }
    input { padding:8px; border:1px solid #d1d5db; border-radius:6px; width:100%; }
    button { padding:8px 12px; border:1px solid #d1d5db; background:#f9fafb; cursor:pointer; border-radius:6px; }
    button:hover { background:#eef2f7; }
    .error { color:#b91c1c; background:#fee2e2; border:1px solid #fecaca; padding:8px; border-radius:6px; margin-bottom:12px; }
    table { width:100%; border-collapse:collapse; }
    th, td { text-align:left; padding:8px; border-bottom:1px solid #eee; vertical-align:middle; }
    th { background:#f9fafb; }
    .muted { color:#666; font-size:12px; }
    .right { text-align:right; }
    .btn-danger { border-color:#ef4444; background:#fee2e2; }
    .btn-danger:hover { background:#fecaca; }
    .disabled { opacity:.55; pointer-events:none; }
  `],
  template: `
    <main class="wrap">
      <h2>Users</h2>

      <div *ngIf="error" class="error">{{ error }}</div>

      <form (submit)="add($event)">
        <div>
          <label>Email</label>
          <input required type="email" placeholder="user@company.com"
                 [value]="email" (input)="email = $any($event.target).value">
        </div>
        <div>
          <label>Password (min. 8 chars)</label>
          <input required type="password" minlength="8" placeholder="********"
                 [value]="password" (input)="password = $any($event.target).value">
        </div>
        <div>
          <button type="submit" [disabled]="saving">Add user</button>
        </div>
      </form>

      <table *ngIf="users.length; else empty">
        <thead>
          <tr>
            <th>Email</th>
            <th>Created</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of users">
            <td>{{ u.email }}</td>
            <td class="muted">{{ u.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
            <td class="right">
              <button
                class="btn-danger"
                [class.disabled]="u.id === meId"
                [title]="u.id === meId ? 'You cannot delete yourself' : 'Delete user'"
                (click)="remove(u)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <ng-template #empty>
        <p class="muted">No users yet.</p>
      </ng-template>
    </main>
  `,
})
export class UsersComponent {
  users: User[] = [];
  email = '';
  password = '';
  error = '';
  saving = false;
  meId = '';

  constructor(private router: Router) {}

  async ngOnInit() {
    const me = await apiFetch('/auth/me', { credentials: 'include', cache: 'no-store' });
    if (!me.ok) { this.router.navigateByUrl('/login'); return; }
    const meJson = await me.json().catch(() => null);
    this.meId = meJson?.id || '';
    await this.refresh();
  }

  async refresh() {
    const res = await apiFetch('/auth/users', { credentials: 'include', cache: 'no-store' });
    this.users = res.ok ? await res.json() : [];
  }

  async add(e: Event) {
    e.preventDefault();
    this.error = '';
    if (!this.email || !this.password || this.password.length < 8) {
      this.error = 'Please enter a valid email and a password with at least 8 characters.';
      return;
    }
    this.saving = true;
    try {
      const res = await apiFetch('/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: this.email.trim(), password: this.password }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.error = text || 'Create user failed.';
        return;
      }
      this.email = '';
      this.password = '';
      await this.refresh();
    } finally {
      this.saving = false;
    }
  }

  async remove(u: User) {
    this.error = '';
    if (u.id === this.meId) {
      this.error = "You can't delete yourself.";
      return;
    }
    const ok = confirm(`Delete user "${u.email}"?`);
    if (!ok) return;

    const res = await fetch(`/auth/users/${u.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.error = text || 'Delete failed.';
      return;
    }
    await this.refresh();
  }
}
