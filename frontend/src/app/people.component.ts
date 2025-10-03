import { apiFetch } from './core/api-fetch'; // útvonal komponenshez képest
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type Person = { id: string; name: string; colorHex: string; isActive: boolean; createdAt: string };
type ColorOption = { name: string; hex: string };

@Component({
  standalone: true,
  selector: 'app-people',
  imports: [CommonModule],
  styles: [`
    .palette { display:grid; grid-template-columns: repeat(10, 24px); gap:8px; }
    .swatch  { width:24px; height:24px; border-radius:4px; cursor:pointer; border:none;
               outline:1px solid #00000040; }
    .swatch[aria-checked="true"] { outline:3px solid #000; }
    .sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden;
              clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    .actions { margin-top: 8px; }
    .btn-primary { padding:8px 12px; border:1px solid #d1d5db; background:#f3f4f6; cursor:pointer; }
    .btn-primary:hover { background:#e5e7eb; }
    .btn-danger { padding:8px 12px; border:1px solid #d1d5db; background:#f3f4f6; cursor:pointer; }
    .btn-danger:hover { background:#e5e7eb; }
    .btn-primary:focus-visible, .btn-danger:focus-visible { outline:3px solid #000; outline-offset:2px; }
  `],
  template: `
    <main style="padding:24px; max-width:720px;">
      <h2>People</h2>

      <form (submit)="add($event)" style="display:grid; gap:12px; align-items:start; margin:12px 0;">
        <input required placeholder="Name" [value]="name" (input)="name = $any($event.target).value">

        <div>
          <div style="margin-bottom:6px;">Color:</div>

          <div role="radiogroup" aria-label="Color palette" class="palette">
            <button *ngFor="let c of colors"
              type="button"
              class="swatch"
              role="radio"
              [attr.aria-checked]="colorHex === c.hex"
              [attr.aria-label]="c.name"
              [attr.title]="c.name"
              (click)="selectColor(c)"
              (keyup.enter)="selectColor(c)"
              (keyup.space)="selectColor(c)"
              [style.background]="c.hex">
              <span class="sr-only">{{ c.name }}</span>
            </button>
          </div>

          <div style="margin-top:6px; font-size:12px;">
            Selected: <strong>{{ selectedColor?.name }}</strong>
            <span style="color:#666;">({{ selectedColor?.hex }})</span>
          </div>

          <div style="margin-top:8px;">
            <input [value]="colorHex" (input)="onHexInput($any($event.target).value)"
                   placeholder="#RRGGBB" style="width:110px;">
          </div>
        </div>

        <button type="submit">Add person</button>
      </form>

      <ul *ngIf="people.length; else empty" style="list-style:none; padding:0; margin:0;">
        <li *ngFor="let p of people"
            style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #eee;">
          <span [style.background]="p.colorHex"
              style="display:inline-block; width:12px; height:12px; border:1px solid #000;"></span>
          <span style="flex:1 1 auto;">
            {{ p.name }} <small style="color:#666">({{ p.colorHex }})</small>
          </span>
          <button
            class="btn-danger"
            (click)="remove(p)"
            [attr.title]="'Delete ' + p.name"
            aria-label="Delete {{ p.name }}">
            Delete
          </button>
        </li>
      </ul>
      <ng-template #empty>
        <p style="color:#666;">No people yet.</p>
      </ng-template>
    </main>
  `,
})
export class PeopleComponent {
  people: Person[] = [];
  name = 'New person';

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

  colorHex = this.colors[8].hex;
  selectedColor: ColorOption | null = this.colors[8];

  constructor(private router: Router) {}

  async ngOnInit() {
    const me = await apiFetch('/auth/me', { credentials: 'include' });
    if (!me.ok) { this.router.navigateByUrl('/login'); return; }
    await this.refresh();
  }

  async refresh() {
    const res = await apiFetch('/people', { credentials: 'include' });
    this.people = res.ok ? await res.json() : [];
  }

  selectColor(c: ColorOption) {
    this.colorHex = c.hex;
    this.selectedColor = c;
  }

  onHexInput(value: string) {
    this.colorHex = value;
    const found = this.colors.find(x => x.hex.toLowerCase() === value.toLowerCase());
    this.selectedColor = found ?? { name: 'Custom', hex: value };
  }

  async add(e: Event) {
    e.preventDefault();
    const res = await apiFetch('/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: this.name, colorHex: this.colorHex }),
    });
    if (res.ok) {
      const created = await res.json();
      this.people = [created, ...this.people];
    }
  }

  async remove(p: Person) {
    const ok = confirm(`Delete "${p.name}"?`);
    if (!ok) return;

    const res = await fetch(`/people/${p.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      this.people = this.people.filter(x => x.id !== p.id);
    } else {
      const text = await res.text().catch(() => '');
      alert(`Delete failed. ${text || ''}`.trim());
    }
  }
}
