import { ColumnsConfigModel } from "./columns-config.model";
import { ActionsConfigModel } from "./actions-config.model";
import { ExpandableRowModeEnum } from "./enums/expandable-row-mode.enum";
import { AddRecordConfigModel } from "./add-record-config.model";
import { ExportConfigModel } from "./export-config.model";
import { PaginationConfigModel } from "./pagination-config.model";

// Configurazione principale della tabella generica
export type TableConfigModel<T extends object, E extends object = never> = {
  // Identificativo univoco della tabella (usato per template, test, ecc.)
  id: string;

  // Titolo principale della tabella (può essere statico o dinamico in base alle entità)
  tableTitle: string | ((entities: T[]) => string);

  // Dati da visualizzare nelle righe della tabella
  entities: T[];

  // Configurazione delle colonne (una entry per ogni colonna)
  columnsConfig: ColumnsConfigModel<T>[];

  // Configurazione della colonna azioni (bottoni, menu, ecc.)
  actionsConfig?: ActionsConfigModel<T>;

  // Sottotitolo opzionale della tabella (può essere statico o dinamico in base alle entità)
  tableSubtitle?: string | ((entities: T[]) => string);

  // Configurazione del pulsante "Aggiungi record"
  addRecordConfig?: AddRecordConfigModel;

  // Dimensione della tabella (small/large)
  tableSize?: 'small' | undefined | 'large';

  // Mostra le linee della griglia tra le celle
  showGridlines?: boolean;

  // Alterna il colore di sfondo tra le righe
  stripedRows?: boolean;

  // Configurazione della paginazione (frontend o backend)
  paginationConfig?: PaginationConfigModel<T>;

  // Configurazione per applicare classi o stili in base ai dati di riga
  conditionalRowConfig?: {
    // Classi CSS calcolate dinamicamente per ogni riga
    ngClass?: (data: T | undefined) => string;

    // Stili inline calcolati dinamicamente per ogni riga
    ngStyle?: (data: T | undefined) => {
      [klass: string]: any;
    }
  };

  // Abilita/disabilita l’ordinamento a livello di tabella
  tableSortable?: boolean;

  // Abilita/disabilita il filtro globale della tabella
  tableFilter?: boolean;

  // Abilita la ridimensionabilità delle colonne
  resizeableColumns?: boolean;

  // Configurazione del pulsante di esportazione
  exportConfig?: ExportConfigModel;

  // Abilita la selezione delle righe (checkbox o row selection)
  selectableRows?: boolean;

  // Configurazione delle righe espandibili
  expandableRowsConfig?:
  // Modalità in cui la riga espansa mostra una tabella inline dello stesso tipo T
    | {
    // Modalità inline: la riga figlia è una tabella con le stesse entità T
    mode: ExpandableRowModeEnum.Inline;

    // Colonne della tabella figlia
    columnsConfig: ColumnsConfigModel<T>[];

    // Azioni della tabella figlia
    actionsConfig?: ActionsConfigModel<T>;

    // Titolo della tabella espansa (può essere statico o dinamico)
    tableTitle: string | ((entities: T[]) => string);

    // Sottotitolo della tabella espansa (può essere statico o dinamico)
    tableSubtitle?: string | ((entities: T[]) => string);

    // Configurazione del pulsante "Aggiungi record" nella tabella espansa
    addRecordConfig?: AddRecordConfigModel;

    // Righe bloccate (frozen) nella tabella espansa
    frozenValues?: T[];

    // Classi e stili dinamici per le righe della tabella espansa
    conditionalRowConfig?: {
      ngClass?: (data: T | undefined) => string;
      ngStyle?: (data: T | undefined) => {
        [klass: string]: any;
      }
    };

    // Dimensione della tabella espansa
    tableSize?: 'small' | undefined | 'large';

    // Mostra le linee della griglia nella tabella espansa
    showGridlines?: boolean;

    // Alterna il colore di sfondo delle righe nella tabella espansa
    stripedRows?: boolean;

    // Abilita/disabilita l’ordinamento nella tabella espansa
    tableSortable?: boolean;

    // Abilita le colonne ridimensionabili nella tabella espansa
    resizeableColumns?: boolean;

    // Abilita/disabilita il filtro nella tabella espansa
    tableFilter?: boolean;

    // Abilita la selezione delle righe nella tabella espansa
    selectableRows?: boolean;
  }
    // Modalità in cui la riga espansa mostra entità figlie di tipo E
    // E viene usato solo se specificato (altrimenti never)
    | (E extends never
    ? never
    : (
    // Sorgente dei dati figli: proprietà di relazione oppure provider esterno
    | {
    // I figli provengono da una proprietà dell’entità padre (es. children)
    mode: ExpandableRowModeEnum.RelationProperty;
    relationProperty: keyof T;
  }
    | {
    // I figli provengono da una funzione che restituisce un elenco di E
    mode: ExpandableRowModeEnum.EntitiesProvider;
    entitiesProvider: (parent: T) => E[];
  }
    ) & {
    // Titolo della tabella figlia (può essere statico o dinamico)
    tableTitle: string | ((entities: E[]) => string);

    // Sottotitolo della tabella figlia (può essere statico o dinamico)
    tableSubtitle?: string | ((entities: E[]) => string);

    // Colonne della tabella figlia (tipo E)
    columnsConfig: ColumnsConfigModel<E>[];

    // Azioni per la tabella figlia
    actionsConfig?: ActionsConfigModel<E>;

    // Configurazione del pulsante "Aggiungi record" nella tabella figlia
    addRecordConfig?: AddRecordConfigModel;

    // Righe bloccate (frozen) nella tabella figlia
    frozenValues?: E[];

    // Classi e stili dinamici per le righe della tabella figlia
    conditionalRowConfig?: {
      ngClass?: (data: E | undefined) => string;
      ngStyle?: (data: E | undefined) => {
        [klass: string]: any;
      }
    };

    // Dimensione della tabella figlia
    tableSize?: 'small' | undefined | 'large';

    // Mostra le linee di griglia nella tabella figlia
    showGridlines?: boolean;

    // Alterna il colore delle righe nella tabella figlia
    stripedRows?: boolean;

    // Abilita/disabilita l’ordinamento nella tabella figlia
    tableSortable?: boolean;

    // Abilita le colonne ridimensionabili nella tabella figlia
    resizeableColumns?: boolean;

    // Abilita/disabilita il filtro nella tabella figlia
    tableFilter?: boolean;

    // Abilita la selezione delle righe nella tabella figlia
    selectableRows?: boolean;
  });

  // Righe bloccate (frozen) nella tabella principale
  frozenValues?: T[];
}

