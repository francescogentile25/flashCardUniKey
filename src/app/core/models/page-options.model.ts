// Modello che rappresenta lo stato completo della paginazione
export type PageOptionsModel<T> = {
  // Numero di elementi per pagina
  pageSize: number;

  // Numero della pagina corrente (1-based o 0-based a seconda dell’implementazione)
  currentPage: number;

  // Numero totale di risultati disponibili
  totalResults: number;

  // Numero totale di pagine calcolato sulla base dei risultati
  totalPages: number;

  // Risultati della pagina corrente (opzionali)
  results?: T[];
}

// Richiesta inviata al backend quando cambia pagina, ordinamento o filtro
export type PageOptionsRequest = {
  // Numero di pagina da richiedere
  page?: number;

  // Numero di elementi per pagina
  pageSize?: number;

  // Campo su cui applicare l’ordinamento
  sortField?: string;

  // Direzione dell’ordinamento
  sortOrder?: SortOrderEnum;

  // Testo di ricerca da applicare ai dati
  search?: string;
}

// Possibili direzioni dell’ordinamento
export enum SortOrderEnum {
  // Nessun ordinamento
  None,

  // Ordinamento crescente
  Asc,

  // Ordinamento decrescente
  Desc
}
