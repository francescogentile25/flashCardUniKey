---
name: component
description: "Genera componente Angular 21 standalone con service, store, models, Signal Forms"
version: 2.0.0
argument-hint: <nome-feature> [--with-store] [--with-table] [--with-form] [--crud]
---

# Genera Componente Feature (Angular 21)

## Parametri
$ARGUMENTS

Se mancano: chiedi il nome della feature.

## Workflow

1. **Leggi contesto**: `FlashCardUniKey.FE/CLAUDE.md` (sezioni "Form (Signal Forms)" + "Feature Angular 21")
2. **Genera modelli**: deploy @component-builder
   - `models/responses/{nome}.response.ts`
   - `models/requests/create-{nome}.request.ts` (se `--crud` o `--with-form`)
   - `models/requests/edit-{nome}.request.ts` (se `--crud`)
3. **Genera service**: `services/{nome}.service.ts` (HttpClient, no RxJS operators inutili)
4. **Se --with-store**: deploy @store-builder
   - `store/{nome}.store.ts` con `createEntityStoreConfig` (se CRUD) oppure `signalStore()` custom
   - Valuta `resource()` nel componente invece dello store se Ã¨ solo read-only
5. **Genera componente**: `.ts` + `.html` + `.scss`
   - Standalone, `inject()`, signal-based input/output
   - Control-flow nativo (`@if`, `@for`, `@switch`, `@defer`)
   - 3 stati gestiti: loading / empty / error
6. **Se --with-form**: usa **Signal Forms** (`@angular/forms/signals`)
   - Import `form`, `required`, `email`, ecc. + direttiva `FormField` nell'array `imports`
   - State signal<FormState<T>> + schema dichiarativo + `submit(form, handler)`
7. **Se --with-table**: deploy @table-builder per configurazione SharedTable
8. **Registra route** in `layout.routes.ts` + `global-paths.config.ts`
9. **Build check**: `cd Frontend && ng build --configuration development`

## Esempio

```
/component products --crud --with-store --with-table
/component product-edit --with-form
/component dashboard
/component user-settings --with-store --with-form
```
