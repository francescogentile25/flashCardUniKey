---
name: Dock floating + icone addoccate (action contestuali per pagina)
description: Pattern bottom-nav floating glass mobile + page-actions pill desktop, con icone addoccate alla stessa chrome del menu in base alla pagina corrente
type: feedback
---

## Cosa intendiamo per "icone addoccate"

"Icone addoccate" = i CTA contestuali della pagina corrente (es. "Nuova utenza", "Indietro", "Modifica", "Disattiva") **non vivono in toolbar/header in cima alla pagina** ma sono **agganciati allo stesso pill flottante** che ospita la nav primaria su mobile. Il pill è uno e solo uno, vetro smerigliato (glass), staccato dai bordi, sopra il body wash. Niente "box in a box": una sola superficie galleggiante per nav + actions.

Su desktop, dove il bottom-nav non esiste, le stesse identiche actions vengono renderizzate in una **page-actions-pill** flottante in basso a destra (stesso glass, stessa lista actions, layout orizzontale). La fonte di verità è una sola: `PageActionsService`.

## Architettura

### Componenti

```
features/_layout/
├── bottom-nav/              ← visibile solo < md (mobile/tablet)
│   ├── bottom-nav.html      ← due zone: .bottom-actions (top) + .bottom-nav-list (bottom)
│   ├── bottom-nav.scss      ← floating glass, fixed bottom + safe-area
│   └── bottom-nav.ts        ← legge nav items + page actions, slot fisso cart
└── page-actions-pill/        ← visibile solo >= md (desktop)
    ├── page-actions-pill.ts  ← inline template, identica lista PageActionsService
    └── page-actions-pill.scss ← floating glass bottom-right
```

### `PageActionsService` (core service, signal-based)

```typescript
export interface PageAction {
  id: string;
  label: string;          // fallback statico
  labelKey?: string;      // chiave i18n (preferita; evita race con TranslateService)
  icon: string;           // nome icona PrimeIcons senza prefisso "pi " (es. 'pi-plus')
  primary?: boolean;      // bottone pieno brand. MAX UNO per pagina.
  iconOnly?: boolean;     // icona sola, label resta solo come aria-label/title
  routerLink?: unknown[] | string;
  queryParams?: Record<string, string | number | boolean | null | undefined>;
  href?: string;
  click?: () => void;
}

@Injectable({ providedIn: 'root' })
export class PageActionsService {
  private readonly _actions = signal<readonly PageAction[]>([]);
  readonly actions = this._actions.asReadonly();
  set(actions: readonly PageAction[]): void { this._actions.set(actions); }
  clear(): void { this._actions.set([]); }
}
```

**Regola di lifecycle**: la pagina chiama `pageActions.set([...])` in un `effect()` o nel `ngOnInit`, e `pageActions.clear()` nel `ngOnDestroy`. Mai più di una pagina che scrive contemporaneamente.

### Nav items primari (config statica)

`core/config/nav-items.config.ts` esporta `primaryNavItems` e `filterNavByRoles(items, roles)`. Le voci hanno: `id`, `route`, `icon`, `labelKey`, `roles?`. Il bottom-nav le filtra per ruolo loggato e prende i primi N (vedi sotto).

## Regole numeriche (touch target / leggibilità)

### Bottom-nav mobile

| Slot | Limite | Note |
|------|--------|------|
| Nav items totali (cart incluso) | **5 max** | iOS/Android touch guidelines |
| Cart slot | 1 fisso al centro | Sempre presente, badge numerico |
| Nav items prima del cart | 2 | `items.slice(0, 2)` |
| Nav items dopo il cart | 2 | `items.slice(2, 4)` |
| Page actions (riga superiore) | 0..N | Renderizzate solo se `pageActions.actions().length > 0` |

```typescript
readonly items = computed(() => {
  const roles = this.authStore.ruoliArray();
  return filterNavByRoles(primaryNavItems, roles).slice(0, 4); // 4 + cart = 5
});
readonly itemsBeforeCart = computed(() => this.items().slice(0, 2));
readonly itemsAfterCart  = computed(() => this.items().slice(2));
```

### Page actions

| Caso | Resa |
|------|------|
| 1 action `primary: true` | bottone pieno brand con label inline |
| 1 action ghost (es. "Indietro") | icon-only (label come aria-label/title) |
| > 3 actions totali | **tutte le secondarie diventano `iconOnly: true`** per leggibilità |
| `iconOnly: true` su un singolo button | width fissa 44px, no label visibile |

Convenzione fissa: **back e delete sono sempre `iconOnly: true`**. La primary può tenere la label se ce n'è solo una.

## Markup canonico

### `bottom-nav.html` (estratto)

```html
<nav class="app-bottom-nav md:hidden" [class.has-actions]="hasActions()">
  @if (hasActions()) {
    <div class="bottom-actions">
      @for (a of actions(); track a.id) {
        <!-- 3 rami: routerLink | href | click -->
        <button type="button" class="bottom-action"
          [class.is-primary]="a.primary"
          [class.is-icon-only]="a.iconOnly || !a.primary"
          (click)="onAction($event, a)"
          [attr.aria-label]="a.labelKey ? (a.labelKey | translate) : a.label">
          <i class="pi {{ a.icon }}" aria-hidden="true"></i>
          @if (a.primary && !a.iconOnly) {
            <span>{{ a.labelKey ? (a.labelKey | translate) : a.label }}</span>
          }
        </button>
      }
    </div>
  }
  <ul class="bottom-nav-list">
    @for (item of itemsBeforeCart(); track item.id) {
      <li><a [routerLink]="item.route" routerLinkActive="is-active">
        <i class="pi {{ item.icon }}"></i>
        <span>{{ item.labelKey | translate }}</span>
      </a></li>
    }
    <li class="bottom-nav-cart-slot">
      <a routerLink="/basket" routerLinkActive="is-active" class="bottom-nav-cart"
         [class.has-badge]="basketCount() > 0">
        <span class="bottom-nav-cart-icon-wrap">
          <i class="pi pi-shopping-cart"></i>
          @if (basketCount() > 0) {
            <span class="bottom-nav-cart-badge">{{ basketLabel() }}</span>
          }
        </span>
        <span>{{ 'header.cart' | translate }}</span>
      </a>
    </li>
    @for (item of itemsAfterCart(); track item.id) {
      <li><a [routerLink]="item.route" routerLinkActive="is-active">
        <i class="pi {{ item.icon }}"></i>
        <span>{{ item.labelKey | translate }}</span>
      </a></li>
    }
  </ul>
</nav>
```

### Esempio uso da una page

```typescript
// gestione-utenti.ts
constructor() {
  effect(() => {
    this.pageActions.set([
      {
        id: 'new-user',
        label: '',
        labelKey: 'gestione.utenti.newCta',
        icon: 'pi-plus',
        click: () => this.openNew(),
        primary: true,
      },
    ]);
  });
}

ngOnDestroy(): void {
  this.pageActions.clear();
}
```

### Esempio detail page (3 actions)

```typescript
this.pageActions.set([
  { id: 'back', label: '', labelKey: 'common.back', icon: 'pi-arrow-left',
    routerLink: ['/gestione/utenti'], iconOnly: true },
  { id: 'edit', label: '', labelKey: 'common.edit', icon: 'pi-pencil',
    click: () => this.openEdit(), primary: true },
  { id: 'delete', label: '', labelKey: 'common.deactivate', icon: 'pi-power-off',
    click: () => this.askDelete(), iconOnly: true },
]);
```

## Stili chiave (SCSS)

### Glass pill (mobile)

```scss
.app-bottom-nav {
  position: fixed;
  left:  var(--space-4);
  right: var(--space-4);
  bottom: calc(var(--safe-bottom) + var(--space-3));
  z-index: var(--z-fixed);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--color-bg-elevated) 72%, transparent);
  backdrop-filter: saturate(1.6) blur(22px);
  -webkit-backdrop-filter: saturate(1.6) blur(22px);
  border: 1px solid color-mix(in srgb, var(--color-border-strong) 55%, transparent);
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.10),
    0 2px 6px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

:global(.dark) .app-bottom-nav {
  background: color-mix(in srgb, var(--color-bg-elevated) 60%, transparent);
  border-color: color-mix(in srgb, white 7%, transparent);
}
```

### Active state nav item (iOS-like)

```scss
/* Niente bg pieno: il pill stesso è già la chrome. Solo color brand + micro-lift. */
.app-bottom-nav a.is-active { color: var(--color-brand); }
.app-bottom-nav a.is-active i { transform: translateY(-1px); }
```

### Bottom actions row (sopra la nav, stesso pill)

```scss
.bottom-actions {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
}

.bottom-action {
  flex: 0 0 auto;
  display: inline-flex;
  flex-direction: row;       /* override del column-stack del nav item */
  align-items: center;
  gap: var(--space-3);
  height: 44px;              /* touch target */
  padding: 0 var(--space-4);
  border-radius: var(--radius-lg);
}

.bottom-action.is-primary {
  flex: 1 1 auto;
  background: var(--color-brand);
  color: var(--color-brand-ink);
}

.bottom-action.is-icon-only {
  flex: 0 0 auto;
  padding: 0;
  width: 44px;
}
```

## Why

UX ricerca-driven: gli utenti su mobile aspettano CTA in basso (raggiungibili col pollice). Toolbar in alto = scroll-up obbligatorio. Pill unico glass = una sola chrome visiva, no rumore. Page-actions pill desktop replica esattamente per non avere divergenza FE↔FE.

## How to apply

- Mai mettere CTA primari di pagina in cima. Sempre via `PageActionsService.set([...])` in `effect()` / `ngOnInit`.
- Sempre `pageActions.clear()` in `ngOnDestroy`.
- Una sola action `primary: true` per pagina.
- Back e delete sempre `iconOnly: true`.
- Se la nav primaria filtrata per ruolo supera 4 voci, **non aumentare lo slot** — riprogetta la nav config (gruppi, sub-route).
- Mai routerLink + click contemporanei senza preventDefault gestito (vedi `onAction()` nel componente).
