import { ActionViewEnum } from "./enums/action-view.enum";
import { ActionTypeEnum } from "./enums/action-type.enum";
import { Observable } from "rxjs";
import { BadgeSizeEnum, SeverityEnum } from "../../../../core/utils/primeng.util";
import { ConfirmationDialogModel } from "../../../../core/models/confirm-dialog.model";

// Configurazione generale della colonna azioni per la tabella
export type ActionsConfigModel<T> = {
  // Modalità di visualizzazione delle azioni (bottoni, menu, split, ecc.)
  actionView?: ActionViewEnum;

  // Etichetta personalizzata per l'intestazione della colonna azioni (può essere statica o dinamica)
  customColumnLabel?: string | ((entities: T[]) => string);

  // Numero massimo di azioni mostrate inline (le altre vanno nel menu)
  maxInlineActions?: number;

  // Nome del template personalizzato usato per il rendering delle azioni
  customTemplate?: string;

  // Elenco delle azioni disponibili per ogni riga
  actions: ActionConfigModel<T>[];

  // Larghezza della colonna (es. "8rem", "120px", "10%")
  columnWidth?: string;

  // Stili inline applicati alla colonna azioni
  columnStyle?: { [key: string]: any };

  // Classe CSS applicata alla colonna azioni
  columnStyleClass?: string;
}

// Configurazione della singola azione
export type ActionConfigModel<T> = {
  // Testo mostrato sul pulsante o nel menu
  label: string | ((data: T | undefined) => string);

  // Icona associata all’azione (es. "pi pi-pencil")
  icon?: string | ((data: T | undefined) => string);

  // Tipo di azione da eseguire (funzione, route, download, ecc.)
  actionType: ActionTypeEnum;

  // Se true, l’azione risulta disabilitata
  disabled?: boolean;

  // Funzione eseguita al click (può essere sincrona o asincrona)
  fn?: (rowData?: T) => void | Observable<any> | Promise<any>;

  // URL usato per navigazione, download o link esterno
  url?: string;

  // Funzione che determina se mostrare o meno l’azione per una riga
  visibleFn?: (rowData?: T) => boolean;

  // Indica l’azione principale (es. usata come azione di default nella modalità split)
  primaryAction?: boolean;

  // Severità grafica del pulsante (es. "success", "info", "warn", "danger")
  severity?: SeverityEnum;

  // Dimensione del pulsante
  size?: 'small' | 'large';

  // Stile outlined del pulsante
  outlined?: boolean;

  // Stile testo (pulsante senza sfondo pieno)
  text?: boolean;

  // Stile raised (pulsante con ombra)
  raised?: boolean;

  // Stile rounded (pulsante con bordi arrotondati)
  rounded?: boolean;

  // Classi CSS aggiuntive per il pulsante
  styleClass?: string;

  // Stili inline per il pulsante
  style?: { [key: string]: any };

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);

  // Abilita un badge sull’azione (es. contatore o stato)
  badge?: boolean;

  // Configurazione del badge associato all’azione
  badgeConfig?: {
    // Valore mostrato nel badge, calcolato in base ai dati della riga
    value: (rowData?: T) => string;

    // Severità grafica del badge
    severity?: SeverityEnum;

    // Dimensione del badge
    size?: BadgeSizeEnum;
  };

  // Se true, rende l’elemento un separatore nel menu
  separator?: boolean;

  // Classi CSS applicate all’elemento di menu (nel caso di vista a menu)
  menuItemStyleClass?: string;

  // Configurazione della dialog di conferma prima di eseguire l’azione
  confirmDialogConfig?: ConfirmationDialogModel;
}
