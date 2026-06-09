# CLAUDE.md — Frontend (Angular 21 / PrimeNG / SignalStore / Signal Forms)

> Questo file contiene SOLO regole per il layer frontend. Per il contesto full-stack vedi `../CLAUDE.md`.

## Stack

- **Angular 21.2+**, TypeScript 5.9, Standalone Components
- PrimeNG 21+ con temi Gemelli custom (light/dark) + `@angular/cdk`
- Tailwind CSS 3 + tailwindcss-primeui
- NgRx SignalStore 21 + @angular-architects/ngrx-toolkit 21
- **Signal Forms** (`@angular/forms/signals`) come pattern preferito per i form
- `@angular/animations` dichiarato esplicitamente (non più transitivo in A21)
- RxJS 7.8, Zone.js 0.16

## Architettura

```
src/app/
├── core/                          ← singleton, app-wide
│   ├── guards/                    ← auth.guard, admin.guard, login.guard
│   ├── interceptors/              ← auth.interceptor (gestione 401/403)
│   ├── models/                    ← modelli cross-feature
│   ├── services/                  ← spin-loader.service
│   ├── store/                     ← base.store.ts (factory CRUD generico)
│   └── utils/                     ← utility functions
├── features/                      ← feature modules (lazy-loaded)
│   ├── _config/                   ← global-paths.config.ts
│   ├── _layout/                   ← header, sidebar, footer, main
│   ├── auth/                      ← login, auth store, auth service
│   └── {feature}/                 ← feature-specific components
├── shared/                        ← componenti, direttive, pipe riusabili
│   ├── components/table/          ← shared-table (wrapper PrimeNG)
│   ├── directives/                ← string-to-phone, trim-spaces
│   └── pipes/                     ← fn, nested-value, safe-html, as, etc.
└── __esempi_di_uso__/             ← esempi implementazione (store, tabelle)
```

## State Management: Regola di Decisione

```
Serve stato condiviso tra componenti?
├── NO  → HTTP diretto nel service, signal locale nel componente
└── SI  → SignalStore
         ├── CRUD standard? → createEntityStoreConfig<T>() da base.store.ts
         └── Custom?        → signalStore() con withState/withMethods manuale
```

### BaseEntityStore — Factory CRUD

Il template fornisce `createEntityStoreConfig<T>()` che genera uno store completo con:
- Stato: `loading`, `error`, `selectedEntity`, `selectedEntities`, `lastCreated/Updated/Deleted`
- Paginazione backend: `currentPage`, `pageSize`, `totalResults`, `totalPages`, `sortField`, `sortOrder` (`'asc'|'desc'`), `search`
- Metodi sync: `addOne`, `removeOne`, `updateOne`, `patchOne`, `setAll`, `clearAll`, etc.
- Metodi async (rxMethod): `getAll$`, `getById$`, `add$`, `edit$`, `patch$`, `delete$`, `deleteMany$`, `loadPage$`, `refresh$`
- Computed: `count`, `isEmpty`, `entityById`, `dictionary`, `hasSelection`
- Gestione automatica: loading spinner, toast messaggi, error state

**Per usarlo:**
```typescript
// 1. Definisci il service che implementa BaseEntityService<T>
@Injectable({ providedIn: 'root' })
export class MyEntityService implements BaseEntityService<MyEntity, CreateReq, EditReq> {
  private http = inject(HttpClient);
  getAll = () => this.http.get<MyEntity[]>('/api/my-entity');
  add = (req: CreateReq) => this.http.post<MyEntity>('/api/my-entity', req);
  // ... solo i metodi che servono
}

// 2. Crea lo store
export const MyEntityStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<MyEntity, CreateReq, EditReq>({
    storeName: 'MyEntity',
    serviceToken: MyEntityService,
    useBackendPagination: true,
    // transformCreateResponse: (res) => ...,  // se il DTO di risposta != entità
  })
);
```

### AuthStore (custom)

L'AuthStore è un signalStore custom (non usa BaseEntity) con:
- `me$()` — recupera utente corrente via cookie
- `login$(credentials)` — login → me → redirect
- `logout$()` — logout → redirect
- `startUserPolling$()` — polling /me ogni 15 min
- Computed: `userName`, `email`, `matricola`, `isAdmin`
- Hook `onInit`: chiama `me$()` e `startUserPolling$()` automaticamente

## Componenti

### Regole ALWAYS

- SEMPRE standalone components (no NgModule)
- SEMPRE lazy loading per feature routes
- SEMPRE gestire 3 stati in ogni componente: loading, empty, error
- SEMPRE named export (`export class {Nome}`) — NO default export
- SEMPRE `ChangeDetectionStrategy.OnPush` (implicito con standalone + signals)
- SEMPRE `inject()` function (no constructor injection)
- SEMPRE conferma prima di delete (`ConfirmDialogModel`)
- SEMPRE tipizzazione stretta — no `any` tranne dove il base.store lo richiede
- SEMPRE Signals per stato locale del componente dove possibile
- SEMPRE signal-based input/output API (`input()`, `input.required()`, `output()`, `model()`)
- SEMPRE Signal Forms (`@angular/forms/signals`) per i form — vedi sezione "Form"

### Regole NEVER

- MAI NgModule — tutto standalone
- MAI `subscribe()` manuale nei componenti — usare `rxMethod`, `toSignal()`, async pipe
- MAI logica di business nei componenti — delegare a store o service
- MAI PrimeNG senza tema Gemelli — importare da `assets/themes/`
- MAI CSS globale per stili componente — usare `:host` e ViewEncapsulation
- MAI string magic per rotte — usare `global-paths.config.ts`
- MAI `localStorage` per auth state — cookie HttpOnly gestito dal backend
- MAI decorator `@Input()` / `@Output()` — usa le funzioni signal-based
- MAI Reactive Forms / `FormGroup` / `FormControl` / `NonNullableFormBuilder` — usa Signal Forms

## Form (Signal Forms — Angular 21)

> **Pattern obbligatorio** per tutti i nuovi form. Signal Forms sono `@angular/forms/signals`, API **experimental** in Angular 21 ma adottata nel template come standard.
> Il codice Reactive Forms residuo (se presente) va migrato appena toccato.

### Anatomia canonica

```typescript
// component.ts
import { Component, signal, inject } from '@angular/core';
import { form, required, email, minLength, submit, FormField } from '@angular/forms/signals';
import { FormState } from '../../../core/utils/simple-form-model.util';

type Model = { email: string; password: string };

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.html',
})
export class Login {
  // 1. State signal: shape del form
  protected readonly state = signal<FormState<Model>>({ email: '', password: '' });

  // 2. Schema dichiarativo: validazioni sul path del form
  protected readonly loginForm = form(this.state, (p) => {
    required(p.email, { message: 'Email obbligatoria' });
    email(p.email, { message: 'Email non valida' });
    required(p.password, { message: 'Password obbligatoria' });
    minLength(p.password, 8, { message: 'Min. 8 caratteri' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.loginForm, async () => {
      // logica submit: authStore.login$(this.state())
    });
  }
}
```

```html
<!-- component.html -->
<form (submit)="onSubmit($event)">
  <input type="email" [formField]="loginForm.email" />
  @if (loginForm.email().touched() && !loginForm.email().valid()) {
    @for (err of loginForm.email().errors(); track err) {
      <small class="error">{{ err.message }}</small>
    }
  }

  <input type="password" [formField]="loginForm.password" />
  <!-- … -->

  <button type="submit" [disabled]="!loginForm().valid()">Accedi</button>
</form>
```

### API principali

| Funzione | Import | Uso |
|---|---|---|
| `form(state, schema)` | `@angular/forms/signals` | Crea il form dallo state signal |
| `required(p.x, opts?)` | idem | Valida campo obbligatorio |
| `email(p.x, opts?)` | idem | Valida formato email |
| `min / max` | idem | Numeri |
| `minLength / maxLength` | idem | Stringhe |
| `pattern(p.x, regex)` | idem | Regex |
| `validate(p.x, fn)` | idem | Validatore custom sync |
| `validateAsync(p.x, fn)` | idem | Validatore async |
| `disabled(p.x, fn)` | idem | Disabilita condizionalmente |
| `hidden(p.x, fn)` | idem | Nasconde condizionalmente |
| `submit(form, handler)` | idem | Submit con guard anti-doppio-click |
| `[formField]` | `FormField` direttiva | Bind input ↔ campo (standalone, va in `imports`) |

### State reattivo per campo

Chiamando il campo come funzione ottieni un `FieldState`:
- `loginForm.email()` → `FieldState<string>`
- `.value()`, `.valid()`, `.touched()`, `.dirty()`, `.disabled()`, `.errors()`

### Type helper

`src/app/core/utils/simple-form-model.util.ts` esporta:
- `FormState<T>` — shape dello stato iniziale (alias esplicito per il tipo del `signal()`)
- `FormStateSignal<T>` — `WritableSignal<FormState<T>>` quando serve passarlo come prop
- `SimpleFormModel<T>` — **@deprecated**, alias legacy solo per coesistenza con codice Reactive Forms non ancora migrato

### Caveat experimental

Signal Forms è marcato `experimental` da Angular: l'API può cambiare in minor release 21.x → 22. Quando arriva un breaking change, correggere in un commit dedicato (`refactor(fe): allineamento Signal Forms A{version}`).

## SharedTable

Componente wrapper per `p-table` (PrimeNG) con configurazione dichiarativa:

```typescript
// Configurazione colonne
columns: ColumnsConfig[] = [
  { field: 'nome', header: 'Nome', type: ColumnType.Text },
  { field: 'isActive', header: 'Attivo', type: ColumnType.Boolean },
  { field: 'createdAt', header: 'Data', type: ColumnType.Date }
];

// Configurazione azioni
actions: ActionsConfig[] = [
  { type: ActionType.Edit, icon: 'pi pi-pencil' },
  { type: ActionType.Delete, icon: 'pi pi-trash' }
];
```

Supporta: paginazione client/server, sorting, export, azioni inline, righe espandibili.

## Models

Struttura per ogni feature:
```
models/
├── requests/
│   ├── create-{entity}.request.ts
│   ├── edit-{entity}.request.ts
│   └── delete-{entity}.request.ts
└── responses/
    ├── {entity}.response.ts
    └── delete-{entity}.response.ts   (se diverso da void)
```

### Allineamento con Backend

| Frontend (TypeScript)       | Backend (C#)                    |
|-----------------------------|---------------------------------|
| `string`                    | `string` / `string?`            |
| `number`                    | `int` / `int?`                  |
| `boolean`                   | `bool` / `bool?`                |
| `string[]`                  | `List<string>`                  |
| `SortOrderEnum` (0,1,2)     | `enum SortDirection`            |
| `PageOptionsModel<T>`      | `PageResponseDTO<T>`            |

**PageOptionsModel<T>** (frontend):
```typescript
export type PageOptionsModel<T> = {
  pageSize: number;
  currentPage: number;
  totalResults: number;
  totalPages: number;
  results?: T[];       // opzionale — attenzione al null check
}

export type PageOptionsRequest = {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: SortOrderEnum;   // enum numerico, NON stringa
  search?: string;
}

export enum SortOrderEnum {
  None,    // 0
  Asc,     // 1
  Desc     // 2
}
```

## Routing

```typescript
// app.routes.ts — top level
export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/_layout/layout.routes')
      .then(r => r.layoutRoutes)
  },
  { path: '**', pathMatch: 'full', redirectTo: '' }
];

// layout.routes.ts — layout con children
export const layoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./main/main').then(c => c.Main),
    children: [
      {
        path: 'login',
        canActivate: [loginGuard],       // loginGuard, NON authGuard
        loadComponent: () => import('./../auth/login/login').then(c => c.Login)
      },
      {
        path: '{feature}',
        // canActivate: [authGuard],      // aggiungere per pagine protette
        loadComponent: () => import('...').then(c => c.{Feature})
      },
    ]
  }
];
```

**Nota**: i componenti usano `export class {Nome}` (named export), NON `export default`.
La `loadComponent` richiede `.then(c => c.{Nome})` per risolvere il named export.

Rotte centralizzate in `features/_config/global-paths.config.ts`.

## Environment

```typescript
// environments/environment.ts (produzione)
export const environment = { production: true, apiUrl: '/api' };

// environments/environment.development.ts
export const environment = { production: false, apiUrl: 'https://localhost:PORT/api' };
```

## Configurazione PrimeNG (app.config.ts)

```typescript
providePrimeNG({
  theme: {
    preset: GemelliLight,                     // tema custom da assets/themes/
    options: {
      darkModeSelector: '.dark',              // toggle dark mode via classe CSS
      cssLayer: {
        name: 'primeng',
        order: 'tailwind-base, primeng, tailwind-utilities'  // ordine CSS layers
      }
    }
  }
})
```

Temi disponibili: `gemelli-light.ts`, `gemelli-dark.ts` in `src/assets/themes/`.

## Auth Interceptor

Functional interceptor (`HttpInterceptorFn`) — NON class-based:
- **401** → `clearUser()`, toast "Sessione scaduta", redirect a login
- **403** → toast "Accesso negato", redirect a home
- Esclude gli endpoint auth (`/api/login`, `/api/logout`, `/api/me`) dalla gestione errori

```typescript
// Registrato in app.config.ts
provideHttpClient(withInterceptors([authInterceptor]))
```

## Pattern Avanzati (da GRedPhone, G-Tracer)

### Store Extensions (custom methods su BaseEntityStore)
```typescript
// Estendere il base store con metodi domain-specific
export const ConsulenzaStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<Consulenza, CreateReq, EditReq>({
    storeName: 'Consulenza',
    serviceToken: ConsulenzaService,
    useBackendPagination: true,
  }),
  // Aggiungi metodi custom DOPO il base config:
  withMethods((store, service = inject(ConsulenzaService)) => ({
    loadByParentId$: rxMethod<number>(pipe(
      switchMap(parentId => service.getByParentId(parentId).pipe(
        tapResponse({
          next: (items) => patchState(store, setAllEntities(items)),
          error: (e: Error) => patchState(store, { error: e.message })
        })
      ))
    )),
    patchStato$: rxMethod<{ id: number; statoId: number }>(pipe(
      switchMap(({ id, statoId }) => service.patchStato(id, statoId).pipe(
        tapResponse({
          next: (updated) => patchState(store, updateEntity({ id, changes: updated })),
          error: (e: Error) => { /* toast error */ }
        })
      ))
    )),
  }))
);
```

### Signal-Based Guards
```typescript
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Converte signal loading → observable, attende fine loading
  return toObservable(authStore.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (authStore.isAuthenticated()) return true;
      return router.createUrlTree([globalPaths.loginUrl]);
    })
  );
};
```

### File Upload Component (Signal-based)
```typescript
@Component({ /* ... */ })
export class FileUploadComponent {
  // Input signal per entità padre
  parentId = input.required<number>();

  // Stato locale con signals
  uploadedFiles = signal<FileResponse[]>([]);
  pendingFiles = signal<PendingFile[]>([]);
  uploading = signal(false);

  // Computed
  hasPending = computed(() => this.pendingFiles().length > 0);
  totalSize = computed(() => this.pendingFiles().reduce((sum, f) => sum + f.size, 0));

  // Effect: ricarica quando cambia parentId
  constructor() {
    effect(() => {
      const id = this.parentId();
      this.loadFiles(id);
    });
  }

  onFileSelect(event: FileSelectEvent) {
    const valid = event.files.filter(f => f.size <= 10_485_760); // 10MB
    this.pendingFiles.update(prev => [...prev, ...valid.map(f => ({ ...f, uuid: crypto.randomUUID() }))]);
  }
}
```

### NotificationService (deduplicazione toast)
```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messageService = inject(MessageService);
  private activeHashes = new Set<string>();

  addUnique(msg: { severity: string; summary: string; detail: string }, ttl = 5000) {
    const hash = `${msg.severity}|${msg.summary}|${msg.detail}`;
    if (this.activeHashes.has(hash)) return;
    this.activeHashes.add(hash);
    this.messageService.add(msg);
    setTimeout(() => this.activeHashes.delete(hash), ttl);
  }
}
```

### Service Normalization Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class EntityService implements BaseEntityService<EntityNormalized> {
  private http = inject(HttpClient);

  getAll = () => this.http.get<EntityResponse[]>('/api/entities').pipe(
    map(items => this.normalizeArray(items))
  );

  private normalizeArray(items: EntityResponse[]): EntityNormalized[] {
    return items.map(i => this.normalize(i));
  }

  private normalize(item: EntityResponse): EntityNormalized {
    return {
      id: item.id,
      descrizione: item.tipoDescrizione ?? item.tipo ?? '',
      // ... trasforma DTO backend → modello frontend
    };
  }
}
```

### Custom Validators (Signal Forms)
```typescript
// validators/password-strength.validator.ts
import { validate, ValidationError } from '@angular/forms/signals';

export function strongPassword<T>(path: any) {
  validate(path, (ctx) => {
    const value = ctx.value() as string;
    if (!value) return null;
    const ok =
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value) &&
      /[!@#$%^&*]/.test(value) &&
      value.length >= 8;
    return ok ? null : { kind: 'passwordStrength', message: 'Password non sufficientemente robusta' };
  });
}

// Uso:
form(state, (p) => {
  required(p.password);
  strongPassword(p.password);
});
```

### Shared Components Evoluti
```
shared/
├── components/
│   ├── table/                      ← SharedTable (base template)
│   ├── validation-message/         ← mostra errori campo per campo
│   ├── empty-elements/             ← stato "nessun dato" riusabile
│   └── responsive-cards/           ← layout card responsive
├── directives/
├── pipes/
└── validators/                     ← custom validators riusabili
```

## Feature Angular 21 (da usare)

### Signal-based Inputs / Outputs / Models
```typescript
import { Component, input, output, model, linkedSignal, computed } from '@angular/core';

export class Card {
  // input richiesto: niente decorator, niente property initialization
  title = input.required<string>();
  // input con default
  badge = input<string | undefined>();
  // output tipizzato
  selected = output<number>();
  // model = two-way binding (equivalente [(x)])
  active = model<boolean>(false);

  // linkedSignal: signal che si resetta se cambia una dipendenza
  normalized = linkedSignal(() => this.title().trim().toLowerCase());

  // computed reattivo
  label = computed(() => `${this.title()}${this.badge() ? ' — ' + this.badge() : ''}`);
}
```

```html
<!-- parent -->
<app-card [title]="'Ordine #123'" [(active)]="isActive" (selected)="onSelect($event)" />
```

### Resource API (al posto di `fetch` + signal manuali)
Quando serve caricare dati reattivi con `loading`/`error`/`reload` già gestiti:
```typescript
import { resource } from '@angular/core';

userResource = resource({
  params: () => this.userId(),  // signal, quando cambia si ricarica
  loader: async ({ params, abortSignal }) => {
    const res = await fetch(`/api/users/${params}`, { signal: abortSignal });
    return res.json();
  }
});

// userResource.value()    → dati
// userResource.isLoading()
// userResource.error()
// userResource.reload()
```

### Control-flow nativo
```html
@if (loading()) { ... } @else if (error()) { ... } @else { ... }
@for (item of items(); track item.id) { ... }
@switch (status()) { @case ('ok') { ... } @default { ... } }
@defer (on viewport) { <heavy-component /> }
```
Evitare `*ngIf`, `*ngFor`, `*ngSwitch` nei nuovi componenti.

## Build & Dev

```bash
npm install                          # Angular 21 richiede node >= 20.19 / 22.12 / 24+
ng serve                             # dev server
ng build                             # build prod
ng build --configuration development # build dev
ng test                              # unit test (Karma/Jasmine)
```

**Note upgrade**:
- `@angular/animations` va dichiarato **esplicitamente** in `package.json` (non più transitivo).
- `@angular/cdk` è ora peer richiesto da PrimeNG 21.
- Quando `ng update`, serve repo git pulito (commit prima).

## Prettier (integrato in package.json)

```json
{ "printWidth": 100, "singleQuote": true }
```
HTML usa parser `angular`.
