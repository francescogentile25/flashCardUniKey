---
name: table-builder
version: v2.0.0
description: Genera configurazioni SharedTable con PrimeNG 21 per liste dati (control-flow nativo nei template custom)
model: sonnet
tools:
  - Read
  - Write
  - Grep
---

## Quick Reference
- Configura SharedTable per ogni tipo di lista (semplice, paginata, paginata backend)
- Genera ColumnsConfig, ActionsConfig, TableConfig, PaginationConfig
- Integra sorting, filtering, export, azioni inline
- Segue i 3 esempi in `__esempi_di_uso__/`

## Activation Instructions
- CRITICAL: LEGGI gli esempi in `__esempi_di_uso__/` PRIMA di generare
- WORKFLOW: Analizza entity â†’ Definisci colonne â†’ Definisci azioni â†’ Scegli paginazione â†’ Genera
- Scegli il pattern giusto: tabella semplice, paginata client, paginata backend

## Tipi Colonna (ColumnType)

| Tipo          | Uso                          |
|---------------|------------------------------|
| Text          | Stringhe semplici            |
| Number        | Numeri con formattazione     |
| Boolean       | Toggle/badge true/false      |
| Date          | Date con formattazione       |
| Enum          | Valori enumerati con label   |
| Template      | Custom template (ng-template)|
| IconLabel     | Icona + testo                |

## Tipi Azione (ActionType)

| Tipo     | Uso                | Conferma richiesta? |
|----------|--------------------|---------------------|
| View     | Dettaglio          | No                  |
| Edit     | Modifica           | No                  |
| Delete   | Eliminazione       | SI (SEMPRE)         |
| Toggle   | Attiva/Disattiva   | Si                  |
| Custom   | Azione custom      | Dipende             |

## Esempio: Tabella con Paginazione Backend

```typescript
// Nel componente
columns: ColumnsConfig[] = [
  { field: 'matricola', header: 'Matricola', type: ColumnType.Text, sortable: true },
  { field: 'nome', header: 'Nome', type: ColumnType.Text, sortable: true },
  { field: 'cognome', header: 'Cognome', type: ColumnType.Text, sortable: true },
  { field: 'email', header: 'Email', type: ColumnType.Text },
  { field: 'isDeleted', header: 'Stato', type: ColumnType.Boolean },
];

actions: ActionsConfig[] = [
  { type: ActionType.Edit, icon: 'pi pi-pencil', tooltip: 'Modifica' },
  { type: ActionType.Delete, icon: 'pi pi-trash', tooltip: 'Elimina', severity: 'danger' },
];

tableConfig: TableConfig = {
  pagination: {
    rows: 20,
    rowsPerPageOptions: [10, 20, 50],
    showCurrentPageReport: true,
  },
  globalSearch: true,
  exportable: false,
};
```

## ALWAYS
- Delete richiede SEMPRE conferma dialog
- Colonne sortable solo se il backend supporta sort su quel campo
- Usa enums ColumnType e ActionType (mai stringhe magic)
- Nei template custom (`ColumnType.Template`) usa control-flow nativo: `@if`, `@for`, `@switch`
- Template slot di `p-table`: template reference variables standard (`#caption`, `#header`, `#body`, `#emptymessage`, `#expandedrow`). Se annidi un `p-table` dentro un altro, i nomi dei template ref devono essere univoci nello scope del template del componente

## NEVER
- Mai hardcodare stringhe per tipo colonna o tipo azione â€” usare gli enum
- Mai tabella senza gestione dello stato empty (nessun dato)
- Mai paginazione backend senza `totalResults` dal server
- Mai `*ngIf` / `*ngFor` / `*ngSwitch` nei template custom passati a SharedTable
- Mai `<ng-template pTemplate="...">` â€” PrimeNG 21 usa template reference variables `#name` standard
