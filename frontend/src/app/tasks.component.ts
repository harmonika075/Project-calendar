import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Person = { id: string; name: string; colorHex: string };
type Task = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  colorHex?: string | null;
  assignments: { personId: string; person: Person }[];
};
type ColorOption = { name: string; hex: string };

@Component({
  standalone: true,
  selector: 'app-tasks',
  imports: [CommonModule],
  styles: [`
    .btn-danger { padding:6px 10px; border:1px solid #fca5a5; background:#fee2e2; color:#991b1b; cursor:pointer; }
    .btn-danger:hover { background:#fecaca; }
    .btn-x { border:1px solid #ddd; background:#f9f9f9; cursor:pointer; padding:0 6px; line-height:1.2; }
    .btn-x:hover { background:#eee; }

    .palette { display:grid; grid-template-columns: repeat(10, 24px); gap:8px; }
    .swatch  { width:24px; height:24px; border-radius:4px; cursor:pointer; border:none; outline:1px solid #00000040; }
    .swatch[aria-checked="true"] { outline:3px solid #000; }
    .sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden;
              clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    .btn-ghost { padding:6px 10px; border:1px solid #d1d5db; background:#f9fafb; cursor:pointer; }
    .btn-ghost:hover { background:#eef2f7; }
  `],
  template: `
    <main style="padding:24px; max-width:1100px;">
      <h2>Tasks</h2>

      <!-- Új task -->
      <section style="border:1px solid #eee; padding:12px; border-radius:8px; margin:12px 0;">
        <h3 style="margin-top:0;">Create task</h3>
        <form (submit)="create(); $event.preventDefault()"
              style="display:flex; gap:12px; align-items:end; flex-wrap:wrap;">
          <div>
            <div>Title</div>
            <input [value]="newTask.title" (input)="newTask.title = $any($event.target).value" required>
          </div>
          <div>
            <div>Start</div>
            <input type="date" [value]="newTask.start" (input)="newTask.start = $any($event.target).value" required>
          </div>
          <div>
            <div>End</div>
            <input type="date" [value]="newTask.end" (input)="newTask.end = $any($event.target).value" required>
          </div>

          <!-- Előre definiált színek -->
          <div style="min-width:320px;">
            <div style="margin-bottom:6px;">Color</div>
            <div role="radiogroup" aria-label="Task color" class="palette">
              <button *ngFor="let c of colors"
                type="button"
                class="swatch"
                role="radio"
                [attr.aria-checked]="selectedColor?.hex === c.hex"
                [attr.aria-label]="c.name"
                [attr.title]="c.name"
                (click)="selectColor(c)"
                (keyup.enter)="selectColor(c)"
                (keyup.space)="selectColor(c)"
                [style.background]="c.hex">
                <span class="sr-only">{{ c.name }}</span>
              </button>
            </div>
            <div style="margin-top:8px; display:flex; gap:8px; align-items:center;">
              <div style="font-size:12px;">
                Selected:
                <strong>{{ selectedColor?.name || 'None' }}</strong>
                <span *ngIf="selectedColor" style="color:#666;">({{ selectedColor.hex }})</span>
              </div>
              <button type="button" class="btn-ghost" (click)="clearColor()" title="No color">None</button>
            </div>
          </div>

          <div>
            <button type="submit" [disabled]="saving">Add task</button>
          </div>
          <div *ngIf="errorMsg" style="color:#991b1b; margin-left:8px;">{{ errorMsg }}</div>
        </form>
      </section>

      <!-- Szűrők -->
      <section>
        <div style="display:flex; gap:12px; align-items:end; flex-wrap:wrap; margin:12px 0;">
          <div>
            <div>From</div>
            <input type="date" [value]="from" (change)="from = $any($event.target).value; refresh()">
          </div>
          <div>
            <div>To</div>
            <input type="date" [value]="to" (change)="to = $any($event.target).value; refresh()">
          </div>
          <div>
            <div>Assignee</div>
            <select [value]="filterPersonId" (change)="filterPersonId = $any($event.target).value; refresh()">
              <option value="">(any)</option>
              <option *ngFor="let p of people" [value]="p.id">{{ p.name }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Lista -->
      <table *ngIf="tasks.length; else empty" border="0" cellpadding="6" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #eee;">
            <th align="left">Title</th>
            <th align="left">Start</th>
            <th align="left">End</th>
            <th align="left">Assignees</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tasks" style="border-bottom:1px solid #f3f3f3;">
            <td>
              <span *ngIf="t.colorHex"
                    [style.background]="t.colorHex"
                    style="display:inline-block; width:12px; height:12px; border:1px solid #000; margin-right:6px;"></span>
              {{ t.title }}
            </td>
            <td>{{ t.startDate | date:'yyyy-MM-dd' }}</td>
            <td>{{ t.endDate   | date:'yyyy-MM-dd' }}</td>
            <td>
              <span *ngFor="let a of t.assignments"
                    style="display:inline-flex; align-items:center; gap:4px; margin-right:8px;">
                <span [style.background]="a.person.colorHex"
                      style="display:inline-block; width:10px; height:10px; border:1px solid #000;"></span>
                {{ a.person.name }}
                <button class="btn-x" (click)="unassign(t, a.personId)"
                        [attr.title]="'Remove ' + a.person.name">×</button>
              </span>
              <div style="margin-top:6px;">
                <select [value]="assigneeSel[t.id] || ''"
                        (change)="assigneeSel[t.id] = $any($event.target).value"
                        style="min-width:160px;">
                  <option value="">(select person)</option>
                  <option *ngFor="let p of people" [value]="p.id">{{ p.name }}</option>
                </select>
                <button (click)="assign(t)">Add</button>
              </div>
            </td>
            <td align="right">
              <button class="btn-danger" (click)="remove(t)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #empty><p style="color:#666;">No tasks.</p></ng-template>
    </main>
  `,
})
export class TasksComponent {
  people: Person[] = [];
  tasks: Task[] = [];
  assigneeSel: Record<string, string> = {};

  // Szűrés
  from = this.today();
  to   = this.addDays(this.from, 30);
  filterPersonId = '';

  // Mentési állapot
  saving = false;
  errorMsg = '';

  // Új task adatai
  newTask = {
    title: 'New task',
    start: this.today(),
    end: this.addDays(this.today(), 7),
  };

  // Előre definiált színek + kiválasztott
  colors: ColorOption[] = [
    { name: 'Dark Red',   hex: '#991B1B' },
    { name: 'Red',        hex: '#EF4444' },
    { name: 'Orange',     hex: '#F97316' },
    { name: 'Gold',       hex: '#F59E0B' },
    { name: 'Yellow',     hex: '#EAB308' },
    { name: 'Light Green',hex: '#22C55E' },
    { name: 'Green',      hex: '#16A34A' },
    { name: 'Light Blue', hex: '#38BDF8' },
    { name: 'Blue',       hex: '#3B82F6' },
    { name: 'Dark Blue',  hex: '#1D4ED8' },
    { name: 'Purple',     hex: '#8B5CF6' },
    { name: 'Magenta',    hex: '#EC4899' },
    { name: 'Teal',       hex: '#14B8A6' },
    { name: 'Brown',      hex: '#92400E' },
    { name: 'Black',      hex: '#000000' },
    { name: 'Dark Gray',  hex: '#374151' },
    { name: 'Gray',       hex: '#6B7280' },
    { name: 'Light Gray', hex: '#D1D5DB' },
    { name: 'White',      hex: '#FFFFFF' },
  ];
  selectedColor: ColorOption | null = this.colors[8]; // Blue alapértelmezett

  async ngOnInit() {
    await this.loadPeople();
    await this.refresh();
  }

  async loadPeople() {
    const res = await fetch('/people', { credentials: 'include' });
    this.people = res.ok ? await res.json() : [];
  }

  async refresh() {
    const url = new URL('/tasks');
    url.searchParams.set('from', this.from);
    url.searchParams.set('to', this.to);
    if (this.filterPersonId) url.searchParams.set('personId', this.filterPersonId);
    const res = await fetch(url, { credentials: 'include' });
    this.tasks = res.ok ? await res.json() : [];
  }

  selectColor(c: ColorOption) { this.selectedColor = c; }
  clearColor() { this.selectedColor = null; }

  async create() {
    this.errorMsg = '';

    if (!this.newTask.title.trim()) {
      this.errorMsg = 'Title is required.';
      return;
    }
    if (this.newTask.end < this.newTask.start) {
      this.errorMsg = 'End date must be after start date.';
      return;
    }

    this.saving = true;
    const payload = {
      title: this.newTask.title.trim(),
      startDate: this.newTask.start,
      endDate: this.newTask.end,
      colorHex: this.selectedColor ? this.selectedColor.hex : null,
    };

    try {
      const res = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        this.errorMsg = res.status === 401
          ? 'Not logged in. Please sign in again.'
          : `Create failed (${res.status}). ${txt}`;
        return;
      }

      // siker
      this.newTask.title = 'New task';
      await this.refresh();
    } catch {
      this.errorMsg = 'Network error while creating task.';
    } finally {
      this.saving = false;
    }
  }

  async remove(t: Task) {
    const ok = confirm(`Delete "${t.title}"?`);
    if (!ok) return;

    await fetch(`/tasks/${t.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await this.refresh();
  }

  async assign(t: Task) {
    const personId = this.assigneeSel[t.id];
    if (!personId) return;

    await fetch(`/tasks/${t.id}/assignees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ personId }),
    });
    this.assigneeSel[t.id] = '';
    await this.refresh();
  }

  async unassign(t: Task, personId: string) {
    await fetch(`/tasks/${t.id}/assignees/${personId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await this.refresh();
  }

  today() { return new Date().toISOString().slice(0, 10); }
  addDays(d: string, n: number) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }
}
