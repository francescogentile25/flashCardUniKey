import { ColumnTypeEnum } from "./enums/column-type.enum";
import { IconLabelStyleEnum } from "./enums/icon-label-style.enum";
import { SeverityEnum } from "../../../../core/utils/primeng.util";
import { Observable } from "rxjs";
import { NestedKeyOf } from "../../../../core/utils/nested-key-of.util";
import { ConfirmationDialogModel } from "../../../../core/models/confirm-dialog.model";

// Configurazione per una colonna con checkbox
export type CheckboxConfigModel<T extends object> = {
  // Valore della checkbox in base ai dati della riga
  value?: (data: T | undefined) => boolean;

  // Funzione eseguita al cambio di stato della checkbox
  fn?: (data?: T) => void;

  // Etichetta associata alla checkbox (es. per aria-label o tooltip)
  label?: string | ((data: T | undefined) => string);

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);

  // Configurazione opzionale di una dialog di conferma prima del cambio
  confirmDialogConfig?: ConfirmationDialogModel;
}

// Configurazione per una colonna con switch on/off
export type SwitchConfigModel<T extends object> = {
  // Valore dello switch in base ai dati della riga
  value?: (data: T | undefined) => boolean;

  // Funzione eseguita al cambio di stato dello switch
  fn?: (data?: T) => void;

  // Etichetta associata al switch (es. per aria-label o tooltip)
  label?: string | ((data: T | undefined) => string);

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);

  // Configurazione opzionale di una dialog di conferma prima del cambio
  confirmDialogConfig?: ConfirmationDialogModel;
}

// Configurazione per una colonna con valore boolean
export type BooleanConfigModel<T extends object> = {
  // Funzione booleana personalizzata (utile per colonne di tipo Boolean)
  customBooleanValue?: (data: T | undefined) => boolean;

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);
}

// Configurazione per una colonna di tipo Date
export type DateConfigModel<T extends object> = {
  // Formato della data (es. 'DD/MM/YYYY', 'DD MMM YYYY HH:mm')
  format?: string;

  // Locale per la formattazione (es. 'it-IT', 'en-US')
  locale?: string;

  // Valore mostrato se la data è null/undefined
  fallback?: string | ((data: T | undefined) => string);

  // Funzione custom per formattare la data (override del format)
  customFormat?: (date: Date | string | null | undefined, data: T | undefined) => string;

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);

  // Stili inline applicati alla cella
  style?: { [key: string]: any };

  // Classi CSS applicate alla cella
  styleClass?: string | ((data: T | undefined) => string);
}

// Configurazione per una colonna di tipo HTML
export type HTMLConfigModel<T extends object> = {
  // Contenuto HTML da renderizzare
  content: string | ((data: T | undefined) => string);

  // Se true, sanitizza l'HTML per prevenire XSS (default: true)
  sanitize?: boolean;

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);

  // Stili inline applicati al contenitore
  style?: { [key: string]: any };

  // Classi CSS applicate al contenitore
  styleClass?: string | ((data: T | undefined) => string);
}

// Configurazione per una colonna di tipo Async (Observable/Promise)
export type AsyncConfigModel<T extends object> = {
  // Source Observable o Promise
  source: (data: T | undefined) => Observable<any> | Promise<any>;

  // Template/messaggio mostrato durante il caricamento
  loadingTemplate?: string;

  // Template/messaggio mostrato in caso di errore
  errorTemplate?: string | ((error: any) => string);

  // Funzione per trasformare il valore ricevuto prima della visualizzazione
  transform?: (value: any, data: T | undefined) => string;

  // Timeout in ms, dopo il quale mostrare errorTemplate (default: nessun timeout)
  timeout?: number;

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);

  // Stili inline applicati alla cella
  style?: { [key: string]: any };

  // Classi CSS applicate alla cella
  styleClass?: string | ((data: T | undefined) => string);
}

// Configurazione per una colonna con valore calcolato tramite funzione custom
export type CustomValueFnConfigModel<T extends object> = {
  // Funzione che calcola il valore da mostrare
  valueFn: (data: T | undefined) => string | number | null | undefined;

  // Prefisso da anteporre al valore (es. "$", "€")
  prefix?: string | ((data: T | undefined) => string);

  // Suffisso da appendere al valore (es. " km", " €/mq")
  suffix?: string | ((data: T | undefined) => string);

  // Valore mostrato se valueFn ritorna null/undefined
  fallback?: string;

  // Testo del tooltip mostrato al passaggio del mouse
  tooltip?: string | ((data: T | undefined) => string);

  // Stili inline applicati alla cella
  style?: { [key: string]: any } | ((data: T | undefined) => { [key: string]: any });

  // Classi CSS applicate alla cella
  styleClass?: string | ((data: T | undefined) => string);
}

// Configurazione di una singola colonna della tabella
export type ColumnsConfigModel<T extends object> = {
  // Proprietà dell’entità associata alla colonna (supporta proprietà annidate)
  property: T extends object ? NestedKeyOf<T> : keyof T;

  // Abilita/disabilita l’ordinamento su questa colonna
  sortableColumn?: boolean;

  // Numero massimo di caratteri da mostrare prima del troncamento con ellissi
  truncateMaxCharacters?: number;

  // Etichetta personalizzata da mostrare nell'intestazione della colonna (può essere statica o dinamica)
  customLabel?: string | ((entities: T[]) => string);

  // Larghezza della colonna (ad esempio in pixel)
  width?: number;

  // Configurazione avanzata del valore mostrato nella colonna
  customValue?: {
    // Tipo di rendering della colonna (data, boolean, icona, ecc.)
    columnType: ColumnTypeEnum;

    // ======= CONFIGURAZIONI NUOVE (RACCOMANDATE) =======

    // Configurazione per colonne di tipo Date
    dateConfig?: DateConfigModel<T>;

    // Configurazione per colonne di tipo HTML
    htmlConfig?: HTMLConfigModel<T>;

    // Configurazione per colonne di tipo Async
    asyncConfig?: AsyncConfigModel<T>;

    // Configurazione per colonne di tipo CustomValueFn
    customValueFnConfig?: CustomValueFnConfigModel<T>;

    // ======= CONFIGURAZIONI ESISTENTI =======

    // Configurazione per visualizzare una checkbox nella cella
    checkboxConfig?: CheckboxConfigModel<T>;

    // Configurazione per visualizzare uno switch nella cella
    switchConfig?: SwitchConfigModel<T>;

    // Configurazione per visualizzare icone e label nella cella
    iconConfig?: {
      // Modalità di visualizzazione (solo icona, solo label, entrambe, template, ecc.)
      iconLabelStyle: IconLabelStyleEnum;

      // Testo etichetta associata all’icona
      label?: string | ((data: T | undefined) => string);

      // Classe dell’icona (es. "pi pi-check")
      icon?: string | ((data: T | undefined) => string);

      // Testo del tooltip mostrato al passaggio del mouse
      tooltip?: string | ((data: T | undefined) => string);

      // Stili inline applicati al contenitore dell’icona
      style?: {
        [klass: string]: any;
      };

      // Classi CSS aggiuntive per il contenitore dell’icona
      styleClass?: string;

      // Se true, applica animazione di rotazione (es. per stato di caricamento)
      spin?: boolean;

      // Nome del template personalizzato usato per il rendering
      template?: string;
    };

    // Configurazione per visualizzare tag/badge nella cella
    tagConfig?: {
      // Se true, rende il tag “pill” (più arrotondato)
      pill?: boolean;

      // Valore testuale del tag in base ai dati della riga
      value?: (data: T | undefined) => string | undefined;

      // Severità grafica del tag in base ai dati (es. success, warn, danger)
      severity?: (data: T | undefined) => SeverityEnum;

      // Configurazione icona per il tag
      iconConfig?: {
        // Classe dell’icona mostrata nel tag
        icon: string | ((data: T | undefined) => string);
      };

      // Nome del template personalizzato per il tag
      template?: string;

      // Stili inline applicati al tag
      style?: {
        [klass: string]: any;
      };

      // Classi CSS aggiuntive per il tag
      styleClass?: string;
    };

    // Configurazione per la stripe colorata associata alla cella
    stripeConfig?: {
      // Colore esadecimale calcolato in base ai dati della riga
      hexColor: (data: T | undefined) => string;
    };

    // Configurazione per formattare il valore come valuta
    currencyConfig?: {
      // Codice valuta (es. "EUR", "USD")
      currencyCode?: string;

      // Modalità di visualizzazione (simbolo/codice/booleano)
      display?: string | boolean;
    };

    // Configurazione per una colonna con valore boolean
    booleanConfig?: BooleanConfigModel<T>;

    // ======= PROPRIETÀ LEGACY (DEPRECATE, mantenute per backward compatibility) =======

    /**
     * @deprecated Usa dateConfig invece per opzioni avanzate
     * Formato della data (es. 'DD/MM/YYYY')
     */
    dateFormat?: string;

    /**
     * @deprecated Usa customValueFnConfig invece per opzioni avanzate
     * Funzione personalizzata per calcolare il valore da mostrare
     */
    customValueFn?: (data: T | undefined) => string;

    /**
     * @deprecated Usa htmlConfig invece per opzioni avanzate
     * Contenuto HTML statico da renderizzare nella cella
     */
    html?: string;

    /**
     * @deprecated Usa asyncConfig invece per opzioni avanzate
     * Observable usato per ottenere un valore asincrono da visualizzare
     */
    observable?: (data: T | undefined) => Observable<any>;
  };

  // Se true, rende la colonna “frozen” (bloccata a sinistra o destra)
  frozenColumn?: boolean;
}
