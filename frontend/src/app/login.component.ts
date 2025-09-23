import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule],
  template: `
    <main style="padding:24px; max-width:420px;">
      <h2>Login</h2>
      <form (submit)="onSubmit($event)" style="display:grid; gap:8px;">
        <input type="email" required placeholder="Email"
               [value]="email" (input)="email = $any($event.target).value">
        <input type="password" required placeholder="Password"
               [value]="password" (input)="password = $any($event.target).value">
        <button type="submit">Login</button>
      </form>
      <p *ngIf="message" style="color:#b00; margin-top:8px;">{{ message }}</p>
    </main>
  `,
})
export class LoginComponent {
  email = 'admin@example.com';
  password = 'admin12345';
  message = '';
  constructor(private router: Router) {}

  async onSubmit(e: Event) {
    e.preventDefault();
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: this.email, password: this.password }),
      });
      if (!res.ok) { this.message = 'Login failed.'; return; }
      this.router.navigateByUrl('/people');
    } catch {
      this.message = 'Network failure.';
    }
  }
}