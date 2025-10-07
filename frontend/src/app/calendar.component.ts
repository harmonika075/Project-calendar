// frontend/src/app/calendar.component.ts
import { apiFetch } from './core/api-fetch'; // útvonal komponenshez képest
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Person = { id: string; name: string; /* colorHex?: string|null (nem használjuk) */ };
type Task = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  colorHex?: string | null;
  assignments: { personId: string; person: Person }[];
};
type DayType = 'OFF' | 'ONLINE' | null;

// --- Backend -> UI típus normalizálás ---
function normalizeDayType(t: any): DayType {
  const v = (typeof t === 'string' ? t : '').trim().toUpperCase();
  if (v === 'OFF' || v === 'HOLIDAY' || v === 'VACATION' || v === 'SICK') return 'OFF';
  if (v === 'ONLINE' || v === 'REMOTE' || v === 'REMOTE_WORK') return 'ONLINE';
  return null;
}

// --- Dátum segédek: helyi idő szerinti YYYY-MM-DD ---
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0); // helyi éjfél
}
function startOfWeekMonday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (x.getDay() + 6) % 7; // 0 = hétfő
  x.setDate(x.getDate() - wd);
  return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

// yyyy-mm-dd tartomány-ellenőrzés
function withinYmd(day: string, start: string, end: string) {
  return day >= start && day <= end;
}

@Component({
  standalone: true,
  selector: 'app-calendar',
  imports: [CommonModule],
  styles: [`
    .toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
    .btn { padding:6px 10px; border:1px solid #d1d5db; background:#f9fafb; cursor:pointer; }
    .btn:hover { background:#eef2f7; }
    .seg { display:inline-flex; border:1px solid #d1d5db; border-radius:6px; overflow:hidden; }
    .seg button { border:0; padding:6px 10px; background:#f9fafb; cursor:pointer; }
    .seg button[aria-pressed="true"] { background:#e5e7eb; font-weight:600; }

    /* Havi rács */
    .month { display:grid; grid-template-columns: repeat(7, 1fr); border:1px solid #e5e7eb; border-right:0; border-bottom:0; }
    .dow { background:#f9fafb; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; padding:6px; font-weight:600; }
    .cell { min-height:160px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; padding:6px; position:relative; }
    .date { font-size:12px; color:#444; }
    .task { display:block; font-size:12px; padding:6px 8px; border-radius:6px; margin-top:6px; background:#f3f4f6; }
    .row { display:flex; align-items:center; gap:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dot { width:10px; height:10px; border:1px solid #000; display:inline-block; border-radius:2px; }
    .assignees { margin-top:4px; display:flex; gap:6px; flex-wrap:wrap; }
    .chip { display:inline-flex; align-items:center; gap:6px; font-size:11px; padding:2px 8px; border-radius:999px; }
    .chip.in-task { border:1px solid rgba(0,0,0,0.08); }

    .avSection { margin-top:8px; font-size:11px; }
    .avGroup { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:4px; }
    .badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; padding:2px 8px; border-radius:999px; color:#fff; }
    .badge.off { background:#dc2626; }
    .badge.online { background:#2563eb; }

    .week { display:grid; grid-template-columns: 120px repeat(7, 1fr); border:1px solid #e5e7eb; border-right:0; border-bottom:0; }
    .wh { background:#f9fafb; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; padding:6px; font-weight:600; text-align:center; }
    .lab { padding:6px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; background:#f9fafb; }
    .col { min-height:260px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; padding:6px; position:relative; }
    .pill { display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:2px 6px; border-radius:999px; margin:4px 4px 0 0; background:#eef2ff; }
    .corner { position:absolute; right:6px; bottom:6px; font-size:11px; }

    .week-people { display:grid; grid-template-columns: 180px repeat(7, 1fr); border:1px solid #e5e7eb; border-right:0; border-bottom:0; }
    .pname { display:flex; align-items:center; gap:8px; padding:6px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; background:#f9fafb; }
    .pcol { min-height:160px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; padding:6px; position:relative; }
    .tag { font-size:10px; padding:0 6px; border-radius:999px; color:#fff; }
    .tag.off { background:#dc2626; }
    .tag.online { background:#2563eb; }

    @media print {
      .no-print { display:none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4 landscape; margin: 10mm; }
      .cell { min-height: 120px; }
      .col { min-height: 210px; }
      .pcol { min-height: 140px; }
    }
  `],
  template: `
    <main style="padding:24px; max-width:1200px;">
      <div class="toolbar">
        <h2>{{ title }}</h2>

        <div class="seg no-print" role="group" aria-label="View">
          <button (click)="setView('month')" [attr.aria-pressed]="view==='month'">Month</button>
          <button (click)="setView('week')"  [attr.aria-pressed]="view==='week'">Week</button>
        </div>

        <div class="seg no-print" *ngIf="view==='week'" role="group" aria-label="Group">
          <button (click)="setGroup('all')"    [attr.aria-pressed]="group==='all'">All tasks</button>
          <button (click)="setGroup('person')" [attr.aria-pressed]="group==='person'">By person</button>
        </div>

        <button class="btn no-print" (click)="prev()">&larr; Prev</button>
        <button class="btn no-print" (click)="today()">Today</button>
        <button class="btn no-print" (click)="next()">Next &rarr;</button>

        <div class="no-print" style="display:flex; gap:12px; align-items:center; margin-left:auto;">
          <label style="display:flex; gap:6px; align-items:center;">
            <input type="checkbox" [checked]="showAvailOverlay" (change)="showAvailOverlay = $any($event.target).checked">
            Show availability
          </label>

          <label>Filter person:</label>
          <select [value]="filterPersonId" (change)="filterPersonId = $any($event.target).value; rebuild()">
            <option value="">(any)</option>
            <option *ngFor="let p of people" [value]="p.id">{{ p.name }}</option>
          </select>

          <button class="btn" (click)="print()">Print PDF</button>
        </div>
      </div>

      <!-- Month -->
      <section *ngIf="view==='month'" class="month">
        <div class="dow" *ngFor="let d of dows">{{ d }}</div>
        <ng-container *ngFor="let day of monthDays">
          <div class="cell">
            <div class="date">{{ toDate(day) | date:'yyyy-MM-dd' }}</div>

            <!-- Feladatok + hozzárendeltek -->
            <div *ngFor="let t of tasksForDay(day)" class="task" [style.background]="(t.colorHex || '#f3f4f6')">
              <div class="row">
                <span class="dot" [style.background]="t.colorHex || '#fff'"></span>
                <span style="overflow:hidden; text-overflow:ellipsis;">{{ t.title }}</span>
              </div>
              <div class="assignees" *ngIf="t.assignments?.length">
                <span class="chip in-task"
                      *ngFor="let a of t.assignments | slice:0:4"
                      [style.background]="t.colorHex || '#f3f4f6'">
                  {{ a.person.name }}
                </span>
                <span class="more" *ngIf="t.assignments.length > 4">+{{ t.assignments.length-4 }}</span>
              </div>
            </div>

            <!-- Elérhetőség (OFF / REMOTE) – feladatoktól független -->
            <div *ngIf="showAvailOverlay" class="avSection">
              <div *ngIf="offPeople(day).length" class="avGroup">
                <span class="badge off" *ngFor="let p of offPeople(day) | slice:0:6">
                  {{ p.name }} OFF
                </span>
                <span class="more" *ngIf="offPeople(day).length > 6">+{{ offPeople(day).length - 6 }}</span>
              </div>
              <div *ngIf="onlinePeople(day).length" class="avGroup">
                <span class="badge online" *ngFor="let p of onlinePeople(day) | slice:0:6">
                  {{ p.name }} REMOTE
                </span>
                <span class="more" *ngIf="onlinePeople(day).length > 6">+{{ onlinePeople(day).length - 6 }}</span>
              </div>
            </div>
          </div>
        </ng-container>
      </section>

      <!-- Week: All tasks -->
      <section *ngIf="view==='week' && group==='all'" class="week">
        <div class="lab">Week</div>
        <div class="wh" *ngFor="let d of weekDays">{{ toDate(d) | date:'EEE dd' }}</div>

        <div class="lab">All-day</div>
        <div class="col" *ngFor="let d of weekDays">
          <!-- Feladatok + hozzárendeltek -->
          <div *ngFor="let t of tasksForDay(d)" class="task" [style.background]="t.colorHex || '#eef2ff'">
            <div class="row">
              <span class="dot" [style.background]="t.colorHex || '#fff'"></span>
              <span style="overflow:hidden; text-overflow:ellipsis;">{{ t.title }}</span>
            </div>
            <div class="assignees" *ngIf="t.assignments?.length">
              <span class="chip in-task"
                    *ngFor="let a of t.assignments | slice:0:6"
                    [style.background]="t.colorHex || '#eef2ff'">
                {{ a.person.name }}
              </span>
              <span class="more" *ngIf="t.assignments.length > 6">+{{ t.assignments.length - 6 }}</span>
            </div>
          </div>

          <!-- Elérhetőségek overlay -->
          <div *ngIf="showAvailOverlay" class="avSection">
            <div *ngIf="offPeople(d).length" class="avGroup">
              <span class="badge off" *ngFor="let p of offPeople(d) | slice:0:8">
                {{ p.name }} OFF
              </span>
              <span class="more" *ngIf="offPeople(d).length > 8">+{{ offPeople(d).length - 8 }}</span>
            </div>
            <div *ngIf="onlinePeople(d).length" class="avGroup">
              <span class="badge online" *ngFor="let p of onlinePeople(d) | slice:0:8">
                {{ p.name }} REMOTE
              </span>
              <span class="more" *ngIf="onlinePeople(d).length > 8">+{{ onlinePeople(d).length - 8 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Week: By person -->
      <section *ngIf="view==='week' && group==='person'" class="week-people">
        <div class="pname"></div>
        <div class="wh" *ngFor="let d of weekDays">{{ toDate(d) | date:'EEE dd' }}</div>

        <ng-container *ngFor="let p of peopleForOverlay()">
          <div class="pname"><strong>{{ p.name }}</strong></div>
          <div class="pcol" *ngFor="let d of weekDays">
            <div *ngFor="let t of tasksForDayAndPerson(d, p.id)" class="pill" [style.background]="t.colorHex || '#eef2ff'">
              <span class="dot" [style.background]="t.colorHex || '#fff'"></span>{{ t.title }}
            </div>
            <div class="corner">
              <ng-container [ngSwitch]="statusFor(p.id, d)">
                <span *ngSwitchCase="'OFF'" class="tag off">OFF</span>
                <span *ngSwitchCase="'ONLINE'" class="tag online">REMOTE</span>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </section>
    </main>
  `,
})
export class CalendarComponent {
  people: Person[] = [];
  tasks: Task[] = [];

  // person -> Map(YYYY-MM-DD -> 'OFF'|'ONLINE')
  dayStatus = new Map<string, Map<string, DayType>>();

  showAvailOverlay = true;

  view: 'month' | 'week' = 'month';
  group: 'all' | 'person' = 'all';

  anchor = new Date();
  dows = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  monthDays: string[] = [];
  weekDays: string[] = [];

  filterPersonId = '';

  get title() {
    const y = this.anchor.getFullYear();
    const m = this.anchor.toLocaleString(undefined, { month: 'long' });
    if (this.view === 'month') return `${m} ${y}`;
    const sw = startOfWeekMonday(this.anchor), ew = addDays(sw, 6);
    return `Week of ${ymd(sw)} – ${ymd(ew)}`;
  }

  async ngOnInit() {
    await this.loadPeople();
    await this.rebuild();
  }

  toDate(value: string | Date): Date {
    return typeof value === 'string' ? fromYmd(value) : value;
  }

  setView(v: 'month'|'week') { this.view = v; this.rebuild(); }
  setGroup(g: 'all'|'person') { this.group = g; this.rebuild(); }
  prev()  { this.anchor = this.view==='month' ? addMonths(this.anchor,-1) : addDays(this.anchor,-7); this.rebuild(); }
  next()  { this.anchor = this.view==='month' ? addMonths(this.anchor, 1) : addDays(this.anchor, 7); this.rebuild(); }
  today() { this.anchor = new Date(); this.rebuild(); }
  print() { window.print(); }

  async loadPeople() {
    const res = await apiFetch('/people', { cache: 'no-store' });
    this.people = res.ok ? await res.json() : [];
  }

  async rebuild() {
    if (this.view === 'month') {
      const first = new Date(this.anchor.getFullYear(), this.anchor.getMonth(), 1);
      const last  = new Date(this.anchor.getFullYear(), this.anchor.getMonth() + 1, 0);
      const start = startOfWeekMonday(first);
      const end   = addDays(startOfWeekMonday(addDays(last, 7)), -1);

      const days: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(ymd(d));
      this.monthDays = days;

      const from = ymd(start), to = ymd(end);
      await this.loadTasks(from, to);
      await this.loadStatusesForRange(from, to);
    } else {
      const start = startOfWeekMonday(this.anchor);
      this.weekDays = Array.from({ length: 7 }, (_, i) => ymd(addDays(start, i)));
      const from = this.weekDays[0], to = this.weekDays[6];
      await this.loadTasks(from, to);
      await this.loadStatusesForRange(from, to);
    }
  }

  async loadTasks(fromISO: string, toISO: string) {
    const params = new URLSearchParams({ from: fromISO, to: toISO });
    if (this.filterPersonId) params.set('personId', this.filterPersonId);
    const res = await apiFetch(`/tasks?${params.toString()}`, { cache: 'no-store' });
    this.tasks = res.ok ? await res.json() : [];
  }

  async loadStatusesForRange(fromISO: string, toISO: string) {
    const temp = new Map<string, Map<string, DayType>>();

    await Promise.all(this.people.map(async p => {
      const params = new URLSearchParams({
        personId: p.id,
        from: fromISO,
        to: toISO,
        _ts: String(Date.now()), // cache-buster
      });

      const opts: RequestInit = {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      };

      let res = await apiFetch(`/availability/days?${params.toString()}`, opts);
      if (res.status === 304) {
        params.set('_ts', String(Date.now() + 1));
        res = await apiFetch(`/availability/days?${params.toString()}`, opts);
      }
      if (!res.ok) return;

      const arr: { date: string; type: any }[] = await res.json().catch(() => []);
      const map = new Map<string, DayType>();
      for (const r of arr) {
        const d = (r.date || '').slice(0, 10);
        const t = normalizeDayType(r.type);
        if (!d) continue;
        if (t !== null) map.set(d, t);
      }
      temp.set(p.id, map);
    }));

    this.dayStatus = temp;
  }

  statusFor(personId: string, dayYmd: string): DayType {
    const map = this.dayStatus.get(personId);
    return map?.get(dayYmd) ?? null; // null = full (munkanapokon), nem jelöljük
  }

  peopleForOverlay(): Person[] {
    return this.filterPersonId ? this.people.filter(p => p.id === this.filterPersonId) : this.people;
  }

  offPeople(dayYmd: string): Person[] {
    const base = this.peopleForOverlay();
    return base.filter(p => this.statusFor(p.id, dayYmd) === 'OFF');
  }
  onlinePeople(dayYmd: string): Person[] {
    const base = this.peopleForOverlay();
    return base.filter(p => this.statusFor(p.id, dayYmd) === 'ONLINE');
  }

  tasksForDay(dayYmd: string) {
    return this.tasks.filter(t => withinYmd(
      dayYmd,
      (t.startDate || '').slice(0, 10),
      (t.endDate   || '').slice(0, 10),
    ));
  }

  tasksForDayAndPerson(dayYmd: string, personId: string) {
    return this.tasks.filter(t =>
      withinYmd(dayYmd, (t.startDate || '').slice(0, 10), (t.endDate || '').slice(0, 10)) &&
      t.assignments?.some(a => a.personId === personId)
    );
  }
}
