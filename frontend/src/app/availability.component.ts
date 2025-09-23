import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type Person = { id: string; name: string; colorHex: string };

@Component({
  standalone: true,
  selector: 'app-availability',
  imports: [CommonModule],
  template: `
    <main style="padding:24px; max-width:800px;">
      <h2>Availability</h2>

      <div *ngIf="!people.length" style="color:#666; margin-bottom:16px;">
        First, create at least one person on the <a routerLink="/people">People</a> page.
      </div>

      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:end;">
        <div>
          <div>Person</div>
          <select [value]="personId" (change)="personId = $any($event.target).value; reloadDays()">
            <option value="">(select)</option>
            <option *ngFor="let p of people" [value]="p.id">{{ p.name }}</option>
          </select>
        </div>

        <div>
          <div>Type</div>
          <select [value]="type" (change)="type = $any($event.target).value">
            <option value="OFF">OFF</option>
            <option value="ONLINE">ONLINE (remote)</option>
          </select>
        </div>

        <div>
          <div>Start date</div>
          <input type="date" [value]="start" (input)="start = $any($event.target).value">
        </div>

        <div>
          <div>End date</div>
          <input type="date" [value]="end" (input)="end = $any($event.target).value">
        </div>

        <button (click)="apply()" [disabled]="!personId">Set range</button>
        <button (click)="clear()" [disabled]="!personId">Clear range</button>
      </div>

      <h3 style="margin-top:24px;">Workweek</h3>
      <div *ngIf="personId; else pick" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <label *ngFor="let d of days; let i = index" style="display:inline-flex; gap:4px; align-items:center;">
          <input type="checkbox" [checked]="maskHas(i)" (change)="toggleDay(i, $any($event.target).checked)">
          {{ d }}
        </label>
        <button (click)="saveWorkweek()">Save</button>
      </div>
      <ng-template #pick><p style="color:#666;">Select a person to set workdays.</p></ng-template>

      <h3 style="margin-top:24px;">Existing day statuses (current month)</h3>
      <div *ngIf="personId; else noperson">
        <ul style="list-style:none; padding:0;">
          <li *ngFor="let r of rows">{{ r.date }} – {{ r.type }}</li>
        </ul>
      </div>
      <ng-template #noperson><p style="color:#666;">Select a person to see entries.</p></ng-template>
    </main>
  `,
})
export class AvailabilityComponent {
  people: Person[] = [];
  personId = '';
  type: 'OFF'|'ONLINE' = 'OFF';
  start = this.today();
  end   = this.today();

  days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  workdaysMask = 62; // Mon-Fri

  rows: { date: string; type: 'OFF'|'ONLINE' }[] = [];

  constructor(private router: Router) {}

  async ngOnInit() {
    // auth ellenőrzés
    const me = await fetch('/auth/me', { credentials: 'include' });
    if (!me.ok) { this.router.navigateByUrl('/login'); return; }

    const res = await fetch('/people', { credentials: 'include' });
    this.people = res.ok ? await res.json() : [];
  }

  async reloadDays() {
    if (!this.personId) return;
    // workweek lekérés
    const ww = await fetch(`/availability/workweek?personId=${this.personId}`, { credentials: 'include' });
    if (ww.ok) { const j = await ww.json(); this.workdaysMask = j.workdaysMask ?? 62; }
    // aktuális hónap bejárása a listához
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last  = new Date(today.getFullYear(), today.getMonth()+1, 0);
    const from = first.toISOString().slice(0,10);
    const to   = last.toISOString().slice(0,10);

    const url = new URL('/availability/days');
    url.searchParams.set('personId', this.personId);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);

    const res = await fetch(url, { credentials: 'include' });
    const arr: { date: string; type: 'OFF'|'ONLINE' }[] = res.ok ? await res.json() : [];
    this.rows = arr.map(x => ({ date: x.date.slice(0,10), type: x.type }));
  }

  async apply() {
    if (!this.personId) return;
    const body = { personId: this.personId, type: this.type, startDate: this.start, endDate: this.end };
    await fetch('/availability/days/bulk', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    await this.reloadDays();
  }

  async clear() {
    if (!this.personId) return;
    const url = new URL('/availability/days');
    url.searchParams.set('personId', this.personId);
    url.searchParams.set('start', this.start);
    url.searchParams.set('end', this.end);
    await fetch(url, { method: 'DELETE', credentials: 'include' });
    await this.reloadDays();
  }

  maskHas(dayIndex: number) {
    return (this.workdaysMask & (1 << dayIndex)) !== 0;
  }
  toggleDay(dayIndex: number, checked: boolean) {
    const bit = 1 << dayIndex;
    this.workdaysMask = checked ? (this.workdaysMask | bit) : (this.workdaysMask & ~bit);
  }
  async saveWorkweek() {
    if (!this.personId) return;
    await fetch('/availability/workweek', {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId: this.personId, workdaysMask: this.workdaysMask }),
    });
  }

  today() { return new Date().toISOString().slice(0,10); }
}
