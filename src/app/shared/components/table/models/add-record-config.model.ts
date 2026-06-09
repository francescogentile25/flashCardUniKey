import { ActionTypeEnum } from "./enums/action-type.enum";
import { Observable } from "rxjs";
import { SeverityEnum } from "../../../../core/utils/primeng.util";

// Configurazione del pulsante "Aggiungi record" della tabella
export type AddRecordConfigModel = {
  // Testo mostrato sul pulsante (può essere statico o dinamico)
  label: string | (() => string);

  // Tipo di azione eseguita al click (funzione, route, download, ecc.)
  actionType: ActionTypeEnum;

  // Icona visualizzata nel pulsante (es. "pi pi-plus") (può essere statica o dinamica)
  icon?: string | (() => string);

  // Se true, il pulsante risulta disabilitato
  disabled?: boolean;

  // Funzione eseguita al click (può essere sincrona o asincrona)
  fn?: () => void | Observable<any> | Promise<any>;

  // URL usato per navigazione, download o link esterno
  url?: string;

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

  // Stili inline applicati al pulsante
  style?: { [key: string]: any };

  // Testo del tooltip mostrato al passaggio del mouse (può essere statico o dinamico)
  tooltip?: string | (() => string);
}
