---
name: store-builder
version: v2.0.0
description: Genera NgRx SignalStore 21 usando il pattern BaseEntity del template Gemelli (o resource() per read-only semplici)
model: sonnet
tools:
  - Read
  - Write
  - Grep
---

## Quick Reference
- Store CRUD â†’ `createEntityStoreConfig<T>()`
- Store custom (non-CRUD) â†’ `signalStore()` manuale
- Read-only semplice senza stato condiviso â†’ `resource()` direttamente nel componente (valuta prima di creare uno store)
- Configura paginazione backend, transformer, messaggi
- Integra con BaseEntityService<T>

## Activation Instructions
- CRITICAL: LEGGI `core/store/base.store.ts` PRIMA di generare qualsiasi store
- WORKFLOW: Analizza requisiti â†’ Scegli pattern (CRUD/custom/resource) â†’ Genera service â†’ Genera store
- Decision tree:
  - CRUD standard con stato condiviso â†’ `createEntityStoreConfig`
  - Custom (auth, dashboard, cose non-tabelle) â†’ `signalStore()` manuale
  - Read-only semplice (dettaglio singolo, dropdown data) â†’ `resource()` nel componente, nessuno store

## Pattern: Store CRUD (90% dei casi)

```typescript
import { signalStore } from '@ngrx/signals';
import { createEntityStoreConfig } from '../../../core/store/base.store';
import { {Nome}Service } from '../services/{nome}.service';
import { {Nome}Response } from '../models/responses/{nome}.response';
import { Create{Nome}Request } from '../models/requests/create-{nome}.request';
import { Edit{Nome}Request } from '../models/requests/edit-{nome}.request';

export const {Nome}Store = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<
    {Nome}Response,          // T (entity con id)
    Create{Nome}Request,     // TCreate
    Edit{Nome}Request        // TUpdate
  >({
    storeName: '{Nome}',
    serviceToken: {Nome}Service,
    useBackendPagination: true,
    // showSuccessMessages: true,    // default
    // showErrorMessages: true,      // default
    // transformCreateResponse: (res) => res,  // se response != entity
  })
);
```

## Pattern: Store Custom

```typescript
import { signalStore, withState, withMethods, withComputed, withHooks } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

type {Nome}State = {
  data: SomeType | null;
  loading: boolean;
  error: string | undefined;
};

export const {Nome}Store = signalStore(
  { providedIn: 'root' },
  withState<{Nome}State>({ data: null, loading: false, error: undefined }),
  withComputed(({ data }) => ({
    // computed signals
  })),
  withMethods((store, service = inject({Nome}Service)) => ({
    load$: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => service.getData().pipe(
          tapResponse({
            next: (data) => patchState(store, { data, loading: false }),
            error: (e: Error) => patchState(store, { error: e.message, loading: false })
          })
        ))
      )
    ),
  })),
  withHooks({ onInit: (store) => store.load$() })
);
```

## Regole Transformer

Usa `transformCreateResponse` quando:
- Il backend ritorna un DTO diverso dall'entity (es. con campi extra)
- Il backend ritorna un wrapper (es. `{ data: entity, message: string }`)

```typescript
transformCreateResponse: (res: CreateResponse) => ({
  id: res.id,
  nome: res.nome,
  // ... map to entity shape
} as {Nome}Response)
```

## Pattern: Resource API (senza store, Angular 21)

Per read-only su singola risorsa reattiva agli input del componente, valuta `resource()` invece di creare uno store dedicato:

```typescript
import { Component, inject, input, resource } from '@angular/core';

@Component({ /* ... */ })
export class {Nome}Detail {
  private service = inject({Nome}Service);
  id = input.required<number>();

  // Reagisce al cambio di id(), gestisce loading/error/reload
  protected readonly data = resource({
    params: () => this.id(),
    loader: async ({ params, abortSignal }) => {
      const res = await fetch(`/api/{endpoint}/${params}`, { signal: abortSignal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<{Nome}Response>;
    }
  });
}
```

Nel template: `data.value()`, `data.isLoading()`, `data.error()`, `data.reload()`.

## Configurazione Paginazione Backend

Quando `useBackendPagination: true`:
- Usa `loadPage$({ page, pageSize, sortField, sortOrder, search })` invece di `getAll$()`
- Lo store traccia automaticamente: `currentPage`, `pageSize`, `totalResults`, `totalPages`
- Il service deve implementare `getPage(request: PageOptionsRequest): Observable<PageOptionsModel<T>>`

## ALWAYS
- `providedIn: 'root'` per store singleton
- Tipo generico esplicito su `createEntityStoreConfig<T, TCreate, TUpdate>`
- Nome store PascalCase: `{Nome}Store`
- `storeName` deve matchare il nome dello store (per DevTools)

## NEVER
- Mai creare uno store CRUD a mano quando `createEntityStoreConfig` basta
- Mai `subscribe()` nel componente â€” usa signals o rxMethod
- Mai stato duplicato tra store diversi
- Mai business logic nello store â€” solo orchestrazione HTTP + stato
