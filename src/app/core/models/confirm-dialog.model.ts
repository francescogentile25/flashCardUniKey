import { SeverityEnum } from "../utils/primeng.util";

// Configurazione per una dialog di conferma
export type ConfirmationDialogModel = {
  // Testo principale del messaggio di conferma
  message: string;

  // Titolo della dialog
  header: string;

  // Icona mostrata nella dialog (es. "pi pi-exclamation-triangle")
  icon?: string;

  // Etichetta del pulsante di conferma (es. "Conferma", "Sì")
  acceptLabel?: string;

  // Etichetta del pulsante di annullamento (es. "Annulla", "No")
  rejectLabel?: string;

  // Classi CSS aggiuntive per il pulsante di conferma
  acceptButtonStyleClass?: string;

  // Classi CSS aggiuntive per il pulsante di annullamento
  rejectButtonStyleClass?: string;

  // Proprietà grafiche del pulsante di conferma
  acceptButtonProps?: {
    // Variante del pulsante (es. testo semplice)
    variant?: 'text' | undefined;

    // Severità grafica (es. "success", "warn", "danger")
    severity?: SeverityEnum;

    // Bordi arrotondati
    rounded?: boolean;

    // Stile outlined
    outlined?: boolean;

    // Pulsante rialzato con ombra
    raised?: boolean;
  }

  // Proprietà grafiche del pulsante di annullamento
  rejectButtonProps?: {
    // Variante del pulsante (es. testo semplice)
    variant?: 'text' | undefined;

    // Severità grafica (es. "success", "warn", "danger")
    severity?: SeverityEnum;

    // Bordi arrotondati
    rounded?: boolean;

    // Stile outlined
    outlined?: boolean;

    // Pulsante rialzato con ombra
    raised?: boolean;
  }
}
