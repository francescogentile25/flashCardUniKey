---
name: angular-feature
description: Use when the user needs to create/update an Angular feature (component + service + store + models + route) that consumes an existing backend endpoint â€” "crea pagina Angular per X", "nuovo componente con tabella Users", "add frontend for /api/orders", "collega FE al nuovo endpoint", "nuova feature frontend", "pagina di gestione X". Generates standalone component (OnPush, named export, inject()) + HTTP service + SignalStore (BaseEntityStore or custom) + request/response models + layout route. Trigger keywords: "angular feature", "nuovo componente", "crea pagina", "standalone component", "SignalStore", "sharedtable", "lista utenti", "form editing", "frontend per endpoint".
---

# Skill: Angular Feature Generator

> Genera una feature Angular completa: models, service, store, componente, routing.

## Quando Usare

- Devi creare una nuova pagina/feature nel frontend
- Serve un componente con tabella, form, o dashboard
- Devi connettere il frontend a un endpoint backend esistente

## Input Richiesto

1. **Nome Feature** (es. `products`, `orders`)
2. **Tipo**: `list` (tabella), `form` (creazione/edit), `detail` (dettaglio), `dashboard`
3. **Endpoint Backend** (es. `GET /api/products` â†’ `PageResponseDTO<ProductResponseDTO>`)
4. **Campi** da visualizzare/editare

## Procedura

### Step 1: Verifica Prerequisiti

```bash
ls FlashCardUniKey.FE/src/app/features/{nome}/ 2>/dev/null || echo "Feature non esiste, la creo"
```

Leggi:
- `FlashCardUniKey.FE/CLAUDE.md` per le regole
- Un esempio da `__esempi_di_uso__/` per pattern tabella
- `core/store/base.store.ts` per il pattern store

### Step 2: Response Model

Crea `FlashCardUniKey.FE/src/app/features/{nome}/models/responses/{nome}.response.ts`:

```typescript
export interface {Nome}Response {
  id: number;
  // Campi allineati al ResponseDTO backend
  // ATTENZIONE: verificare nullabilitÃ  (string vs string | null)
  campo1: string;
  campo2?: string;        // opzionale se backend ha string?
  isActive: boolean;
}
```

### Step 3: Request Models

Crea `FlashCardUniKey.FE/src/app/features/{nome}/models/requests/create-{nome}.request.ts`:

```typescript
export interface Create{Nome}Request {
  // Campi allineati al Command backend (senza id)
  campo1: string;
  campo2?: string;
}
```

Crea `edit-{nome}.request.ts` (se serve):

```typescript
export interface Edit{Nome}Request {
  id: number;
  campo1: string;
  campo2?: string;
}
```

### Step 4: Service HTTP

Crea `FlashCardUniKey.FE/src/app/features/{nome}/services/{nome}.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseEntityService } from '../../../core/store/base.store';
import { {Nome}Response } from '../models/responses/{nome}.response';
import { Create{Nome}Request } from '../models/requests/create-{nome}.request';
import { Edit{Nome}Request } from '../models/requests/edit-{nome}.request';
import { PageOptionsModel, PageOptionsRequest } from '../../../core/models/page-options.model';

@Injectable({ providedIn: 'root' })
export class {Nome}Service implements BaseEntityService<
  {Nome}Response,
  Create{Nome}Request,
  Edit{Nome}Request
> {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/{endpoint}`;

  getAll = (): Observable<{Nome}Response[]> =>
    this.http.get<{Nome}Response[]>(this.apiUrl);

  getPage = (req: PageOptionsRequest): Observable<PageOptionsModel<{Nome}Response>> => {
    let params = new HttpParams();
    if (req.page) params = params.set('page', req.page);
    if (req.pageSize) params = params.set('pageSize', req.pageSize);
    if (req.search) params = params.set('search', req.search);
    if (req.sortField) params = params.set('sortField', req.sortField);
    if (req.sortOrder !== undefined) params = params.set('sortDirection', req.sortOrder);
    return this.http.get<PageOptionsModel<{Nome}Response>>(this.apiUrl, { params });
  };

  getById = (id: number | string): Observable<{Nome}Response> =>
    this.http.get<{Nome}Response>(`${this.apiUrl}/${id}`);

  add = (req: Create{Nome}Request): Observable<{Nome}Response> =>
    this.http.post<{Nome}Response>(this.apiUrl, req);

  edit = (req: Edit{Nome}Request): Observable<{Nome}Response> =>
    this.http.put<{Nome}Response>(`${this.apiUrl}/${req.id}`, req);

  delete = (id: number | string): Observable<void> =>
    this.http.delete<void>(`${this.apiUrl}/${id}`);
}
```

**Se serve normalizzazione** (backend DTO diverso dal modello frontend):
```typescript
getAll = (): Observable<{Nome}Response[]> =>
  this.http.get<BackendDTO[]>(this.apiUrl).pipe(
    map(items => items.map(i => this.normalize(i)))
  );

private normalize(item: BackendDTO): {Nome}Response {
  return {
    id: item.id,
    descrizione: item.tipoDescrizione ?? item.tipo ?? '',
  };
}
```

### Step 5: Store

Crea `FlashCardUniKey.FE/src/app/features/{nome}/store/{nome}.store.ts`:

**CRUD Standard:**
```typescript
import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { {Nome}Service } from '../services/{nome}.service';
import { {Nome}Response } from '../models/responses/{nome}.response';
import { Create{Nome}Request } from '../models/requests/create-{nome}.request';
import { Edit{Nome}Request } from '../models/requests/edit-{nome}.request';

export const {Nome}Store = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<{Nome}Response, Create{Nome}Request, Edit{Nome}Request>({
    storeName: '{Nome}',
    serviceToken: {Nome}Service,
    useBackendPagination: true,
  })
);
```

**Con metodi custom (se serve):**
```typescript
import { withMethods } from '@ngrx/signals';
import { patchState, setAllEntities, updateEntity } from '@ngrx/signals/entities';
// ... imports ...

export const {Nome}Store = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<{Nome}Response, Create{Nome}Request, Edit{Nome}Request>({
    storeName: '{Nome}',
    serviceToken: {Nome}Service,
    useBackendPagination: true,
  }),
  withMethods((store, service = inject({Nome}Service)) => ({
    // Metodi domain-specific
    loadByParentId$: rxMethod<number>(pipe(
      switchMap(parentId => service.getByParentId(parentId).pipe(
        tapResponse({
          next: (items) => patchState(store, setAllEntities(items), { loading: false }),
          error: (e: Error) => patchState(store, { error: e.message, loading: false })
        })
      ))
    )),
  }))
);
```

### Step 6: Componente (Angular 21)

Crea 3 file: `{nome}.ts`, `{nome}.html`, `{nome}.scss`

**{nome}.ts â€” variante LIST:**
```typescript
import { Component, inject, OnInit } from '@angular/core';
import { {Nome}Store } from './store/{nome}.store';

@Component({
  selector: 'app-{nome}',
  imports: [/* PrimeNG imports, SharedTableComponent */],  // niente CommonModule
  templateUrl: './{nome}.html',
  styleUrl: './{nome}.scss',
})
export class {NomePascal} implements OnInit {
  private store = inject({Nome}Store);

  // Signals dallo store
  protected readonly entities = this.store.entities;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly totalResults = this.store.totalResults;

  ngOnInit() {
    this.store.loadPage$({ page: 1, pageSize: 20 });
  }

  onPageChange(event: { first: number; rows: number }) {
    this.store.loadPage$({
      page: Math.floor(event.first / event.rows) + 1,
      pageSize: event.rows,
    });
  }

  onDelete(id: number) {
    // SEMPRE conferma prima di delete (PrimeNG ConfirmDialog)
    this.store.delete$(id);
  }
}
```

**{nome}.ts â€” variante FORM (Signal Forms):**
```typescript
import { Component, inject, input, signal } from '@angular/core';
import { form, required, email, submit, FormField } from '@angular/forms/signals';
import { FormState } from '../../core/utils/simple-form-model.util';
import { Create{Nome}Request } from './models/requests/create-{nome}.request';

@Component({
  selector: 'app-{nome}-form',
  imports: [FormField],
  templateUrl: './{nome}-form.html',
  styleUrl: './{nome}-form.scss',
})
export class {Nome}Form {
  private store = inject({Nome}Store);

  // Input signal-based (se il form Ã¨ in modalitÃ  edit)
  id = input<number | undefined>();

  protected readonly state = signal<FormState<Create{Nome}Request>>({
    campo1: '',
    campo2: '',
  });

  protected readonly f = form(this.state, (p) => {
    required(p.campo1, { message: 'Campo1 obbligatorio' });
    // email(p.email, { message: 'Email non valida' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.f, async () => {
      const req = this.state();
      if (this.id()) {
        this.store.edit$({ id: this.id()!, ...req } as any);
      } else {
        this.store.add$(req);
      }
    });
  }
}
```

**{nome}.html â€” variante LIST:**
```html
@if (loading()) {
  <div class="flex justify-center p-4">
    <i class="pi pi-spinner pi-spin text-2xl"></i>
  </div>
} @else if (error(); as err) {
  <p-message severity="error" [text]="err"></p-message>
} @else if (entities().length === 0) {
  <div class="text-center p-8 text-gray-500">Nessun elemento trovato</div>
} @else {
  <!-- SharedTable o tabella custom -->
}
```

**{nome}-form.html â€” variante FORM:**
```html
<form (submit)="onSubmit($event)">
  <label>
    <span>Campo1</span>
    <input type="text" [formField]="f.campo1" />
    @if (f.campo1().touched() && !f.campo1().valid()) {
      @for (err of f.campo1().errors(); track err) {
        <small class="error">{{ err.message }}</small>
      }
    }
  </label>

  <button type="submit" [disabled]="!f().valid()">Salva</button>
</form>
```

### Step 7: Registra Route

In `FlashCardUniKey.FE/src/app/features/_layout/layout.routes.ts`:
```typescript
{
  path: '{nome}',
  loadComponent: () => import('./../{nome}/{nome}').then(c => c.{NomePascal})
},
```

In `FlashCardUniKey.FE/src/app/features/_config/global-paths.config.ts`:
```typescript
const {nome}Url: string = '/{nome}';
export const globalPaths = {
  // ...existing,
  {nome}Url,
};
```

### Step 8: Verifica

```bash
cd Frontend && ng build 2>&1 | tail -5
```

## Checklist Finale

- [ ] Modelli response allineati al ResponseDTO backend (nullabilitÃ !)
- [ ] Service implementa `BaseEntityService<T>` con i tipi corretti
- [ ] Store usa `createEntityStoreConfig` con `useBackendPagination: true`
- [ ] Componente gestisce 3 stati: loading, empty, error
- [ ] Named export (`export class {Nome}`, non default)
- [ ] `inject()` per DI (no constructor injection)
- [ ] Signal-based input/output (no `@Input()`/`@Output()`)
- [ ] Form usa **Signal Forms** (`@angular/forms/signals` + direttiva `FormField`)
- [ ] Control-flow nativo `@if/@for/@switch` (no `*ngIf`/`*ngFor`)
- [ ] Rotta registrata in `layout.routes.ts` + `global-paths.config.ts`
- [ ] Delete con conferma dialog
- [ ] Zero `any` types
- [ ] Zero `subscribe()` manuale
- [ ] `ng build` passa
