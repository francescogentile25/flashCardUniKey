import { Observable } from "rxjs";
import { SeverityEnum } from "../../../../core/utils/primeng.util";

// Configurazione del pulsante di esportazione
export type ExportConfigModel = {
  // Testo mostrato sul pulsante di export (può essere statico o dinamico in base alla selezione)
  label: string | ((selectedIds?: (string | number)[]) => string);

  // Se true, passa alla funzione solo gli ID selezionati tramite checkbox
  fromCheckboxSelection?: boolean;

  // Icona visualizzata nel pulsante (es. "pi pi-file-excel") (può essere statica o dinamica)
  icon?: string | (() => string);

  // Se true, il pulsante risulta disabilitato
  disabled?: boolean;

  // Funzione eseguita al click, che può ricevere l'elenco degli ID selezionati
  fn?: (ids?: (string | number)[]) => void | Observable<any> | Promise<any>;

  // Severità grafica del pulsante (es. "success", "info", "warn", "danger")
  severity?: SeverityEnum;

  // Dimensione del pulsante
  size?: 'small' | 'large';

  // Stile outlined del pulsante
  outlined?: boolean;

  // Pulsante con stile "testo" (senza sfondo)
  text?: boolean;

  // Pulsante con ombra
  raised?: boolean;

  // Bordi arrotondati
  rounded?: boolean;

  // Classi CSS aggiuntive per il pulsante
  styleClass?: string;

  // Stili inline applicati al pulsante
  style?: { [key: string]: any };

  // Testo del tooltip mostrato al passaggio del mouse (può essere statico o dinamico in base alla selezione)
  tooltip?: string | ((selectedIds?: (string | number)[]) => string);
}

