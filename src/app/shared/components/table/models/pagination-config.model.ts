import { PageOptionsModel, PageOptionsRequest } from "../../../../core/models/page-options.model";

// Configurazione della paginazione per la tabella
export type PaginationConfigModel<T> = {
  // Numero di righe visualizzate per pagina
  rows: number;

  // Opzioni selezionabili per il numero di righe per pagina
  rowsPerPageOptions: number[];

  // Configurazione per la paginazione gestita da backend
  backendConfig?: {
    // Stato corrente della paginazione/ordinamento/filtri inviato al backend
    pageOptions: PageOptionsModel<Omit<T, 'results'>>;

    // Funzione chiamata quando cambia pagina, filtro o ordinamento
    pageChange: (request: PageOptionsRequest) => void;
  }
}
