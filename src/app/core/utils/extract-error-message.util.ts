export function extractErrorMessage(error: any): string {
  if (error?.error?.error) return error.error.error;
  if (error?.status) {
    switch (error.status) {
      case 400: return 'Richiesta non valida. Verifica i dati inseriti.';
      case 401: return 'Non sei autorizzato a eseguire questa operazione.';
      case 404: return 'Risorsa non trovata.';
      case 409: return 'Conflitto: la risorsa esiste già o è in uso.';
      case 500: return 'Errore interno del server. Riprova più tardi.';
      case 503: return 'Servizio temporaneamente non disponibile.';
      default: return 'Si è verificato un errore imprevisto.';
    }
  }
  return 'Si è verificato un errore imprevisto.';
}
