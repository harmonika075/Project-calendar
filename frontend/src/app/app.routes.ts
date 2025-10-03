import { apiFetch } from './core/api-fetch'; // útvonal komponenshez képest
import { Routes, Router, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';

import { LoginComponent } from './login.component';
import { PeopleComponent } from './people.component';
import { TasksComponent } from './tasks.component';
import { AvailabilityComponent } from './availability.component';
import { CalendarComponent } from './calendar.component';
import { UsersComponent } from './users.component';

// Admin guard – SSR alatt ne ellenőrizzünk, kliensen igen
const adminOnlyGuard: CanMatchFn = async () => {
  // SSR-ből ne blokkoljunk (nincs böngésző süti)
  if (typeof window === 'undefined') return true;

  const router = inject(Router);
  try {
    const res = await apiFetch('/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return router.parseUrl('/login');
    const me = await res.json();
    return me?.isAdmin ? true : router.parseUrl('/calendar');
  } catch {
    return router.parseUrl('/login');
  }
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'people', component: PeopleComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'availability', component: AvailabilityComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'users', component: UsersComponent, canMatch: [adminOnlyGuard] }, // admin only
];
