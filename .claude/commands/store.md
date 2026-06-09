---
name: store
description: "Genera NgRx SignalStore 21 (CRUD / custom / resource)"
version: 2.0.0
argument-hint: <nome-feature> [--type crud|custom|resource] [--pagination backend|client]
---

# Genera Store (Angular 21 / NgRx 21)

## Parametri
$ARGUMENTS

Default: `--type crud --pagination backend`

## Workflow

Deploy @store-builder:

1. **CRUD store** (default):
   - Verifica che il service implementi `BaseEntityService<T>`
   - Genera store con `createEntityStoreConfig<T>()`
   - Configura paginazione backend se richiesta

2. **Custom store** (`--type custom`):
   - Genera `signalStore()` con `withState`, `withMethods`, `withComputed`, `withHooks`
   - Chiedi quali metodi servono
   - Pattern `rxMethod` per chiamate async osservabili, `patchState` per aggiornamenti

3. **Resource** (`--type resource`):
   - **Non genera nessuno store**: stampa snippet `resource({ params, loader })` da incollare nel componente
   - Usa questo pattern quando lo stato NON Ã¨ condiviso tra componenti e il loading Ã¨ legato a un signal input

## Esempio

```
/store products --type crud --pagination backend
/store dashboard --type custom
/store user-detail --type resource
```
