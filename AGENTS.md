# AGENTS.md â€” Frontend (Angular 21 / PrimeNG / SignalStore / Signal Forms)

> File cross-harness (Codex CLI, Cursor, Aider, ecc.).
> Contenuto canonico in [`CLAUDE.md`](CLAUDE.md) allo stesso livello. Leggere **quello** per la documentazione completa (SharedTable, BaseEntityStore, Signal Forms, pattern avanzati).
> Vedi anche [`../AGENTS.md`](../AGENTS.md) per il contesto full-stack.

## Stack

- **Angular 21.2+**, TypeScript 5.9, Standalone Components
- PrimeNG 21+ con temi Gemelli custom (light/dark) + `@angular/cdk`
- Tailwind CSS 3 + tailwindcss-primeui
- NgRx SignalStore 21 + @angular-architects/ngrx-toolkit 21
- **Signal Forms** (`@angular/forms/signals`) â€” pattern preferito per i form
- `@angular/animations` dichiarato esplicitamente
- RxJS 7.8, Zone.js 0.16

## State Management: regola di decisione

```
Serve stato condiviso tra componenti?
â”œâ”€â”€ NO  â†’ HTTP diretto nel service, signal locale nel componente
â””â”€â”€ SI  â†’ SignalStore
         â”œâ”€â”€ CRUD standard? â†’ createEntityStoreConfig<T>() da base.store.ts
         â””â”€â”€ Custom?        â†’ signalStore() con withState/withMethods manuale
```

## Form: regola di decisione

```
Nuovo form?
â””â”€â”€ SEMPRE Signal Forms (`@angular/forms/signals`)
    â”œâ”€â”€ state signal<FormState<T>>
    â”œâ”€â”€ form(state, schema) con required/email/min/max/validate
    â”œâ”€â”€ [formField]="form.field" nel template
    â””â”€â”€ submit(form, async () => { ... })

Form esistente su Reactive Forms?
â””â”€â”€ MIGRA a Signal Forms appena lo tocchi (anche per un piccolo fix)
```

## Regole ALWAYS (critiche)

- SEMPRE standalone components (no NgModule)
- SEMPRE lazy loading per feature routes
- SEMPRE gestire 3 stati nel componente: loading, empty, error
- SEMPRE named export (`export class {Nome}`) â€” NO default export
- SEMPRE `ChangeDetectionStrategy.OnPush` (implicito con standalone + signals)
- SEMPRE `inject()` function (no constructor injection)
- SEMPRE conferma prima di delete (`ConfirmDialogModel`)
- SEMPRE tipizzazione stretta â€” no `any` tranne dove il base.store lo richiede
- SEMPRE signals per stato locale del componente dove possibile
- SEMPRE signal-based input/output (`input()`, `input.required()`, `output()`, `model()`)
- SEMPRE Signal Forms (`@angular/forms/signals`) per i form
- SEMPRE control-flow nativo (`@if`, `@for`, `@switch`, `@defer`) â€” niente `*ngIf`/`*ngFor`

## Regole NEVER (critiche)

- MAI NgModule â€” tutto standalone
- MAI `subscribe()` manuale nei componenti â€” usa `rxMethod`, `toSignal()`, async pipe
- MAI logica di business nei componenti â€” delega a store o service
- MAI PrimeNG senza tema Gemelli â€” importa da `assets/themes/`
- MAI CSS globale per stili componente â€” usa `:host` + ViewEncapsulation
- MAI string magic per rotte â€” usa `global-paths.config.ts`
- MAI `localStorage` per auth state â€” cookie HttpOnly gestito dal backend
- MAI decorator `@Input()` / `@Output()` â€” usa le funzioni signal-based
- MAI Reactive Forms / `FormGroup` / `FormControl` / `NonNullableFormBuilder` â€” usa Signal Forms
- MAI `*ngIf` / `*ngFor` / `*ngSwitch` nei nuovi template

## Allineamento contratti BEâ†”FE

| Frontend (TS)           | Backend (C#)          |
|-------------------------|-----------------------|
| `string` / `string?`    | `string` / `string?`  |
| `number`                | `int` / `decimal`     |
| `boolean`               | `bool` / `bool?`      |
| `SortOrderEnum` (0,1,2) | `enum SortDirection`  |
| `PageOptionsModel<T>`   | `PageResponseDTO<T>`  |

`PageOptionsRequest.sortOrder` Ã¨ **numerico** (`SortOrderEnum`), MAI stringa.

## Quick links

- **Signal Forms**: vedi [`CLAUDE.md`](CLAUDE.md#form-signal-forms--angular-21)
- **Angular 21 features** (resource, linkedSignal, model, control-flow): vedi [`CLAUDE.md`](CLAUDE.md#feature-angular-21-da-usare)
- **BaseEntityStore + factory**: vedi [`CLAUDE.md`](CLAUDE.md#baseentitystore--factory-crud)
- **AuthStore** (custom signalStore): vedi [`CLAUDE.md`](CLAUDE.md#authstore-custom)
- **SharedTable**: vedi [`CLAUDE.md`](CLAUDE.md#sharedtable)
- **Auth Interceptor** (401/403): vedi [`CLAUDE.md`](CLAUDE.md#auth-interceptor)
- **Pattern avanzati** (store extensions, signal guards, file upload, notifications): vedi [`CLAUDE.md`](CLAUDE.md#pattern-avanzati-da-gredphone-g-tracer)
- **Agenti frontend** in `.claude/agents/`: `component-builder`, `store-builder`, `table-builder`
- **Skill frontend** in `.claude/skills/angular-feature.md`
- **Comandi frontend** in `.claude/commands/`: `/component`, `/store`

## Build

```bash
npm install                          # Angular 21 richiede node >= 20.19 / 22.12 / 24+
ng serve                             # dev server
ng build                             # prod build
ng build --configuration development
ng test                              # Karma/Jasmine
```

**Note upgrade A21**:
- `@angular/animations` esplicito (non piÃ¹ transitivo).
- `@angular/cdk` peer di PrimeNG 21.
- `ng update` richiede repo git pulito.

## Prettier

```json
{ "printWidth": 100, "singleQuote": true }
```

HTML usa parser `angular`.

## Per Codex

- Quando un prompt Claude dice `@component-builder`, leggi `.claude/agents/component-builder.md` e adotta quel ruolo.
- Quando dice `@store-builder` o `@table-builder`, leggi il file corrispondente in `.claude/agents/`.
- Quando dice "esegui skill `angular-feature`", leggi `.claude/skills/angular-feature.md` come playbook.
- I form **nuovi** devono usare Signal Forms (`@angular/forms/signals`): import `form`, `required`, `email`, ecc. + direttiva `FormField` nell'array `imports` del componente.
