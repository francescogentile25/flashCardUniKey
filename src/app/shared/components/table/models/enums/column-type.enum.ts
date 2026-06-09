// Tipologie di rendering supportate dalla cella della tabella
export enum ColumnTypeEnum {
  // Valore data, formattato tramite dateFormat (es. 'DD/MM/YYYY')
  Date,

  // Valore booleano, mostrato come icone/tag (es. check verde / croce rossa)
  Boolean,

  // Checkbox interattiva nella cella (esecuzione di una funzione al cambio)
  Checkbox,

  // Interruttore on/off (toggle switch) nella cella
  Switch,

  // Icona (con o senza etichetta) per rappresentare uno stato o un’azione
  Icon,

  // Uno o più tag (p-tag) per mostrare stato, categoria o badge
  Tags,

  // Testo con “bandella” colorata a sinistra (stripe) basata su una funzione
  WithStripe,

  // Valore numerico formattato come valuta (currency)
  Currency,

  // Contenuto HTML renderizzato tramite [innerHTML] (sanitizzato con safeHtml)
  HTML,

  // Valore asincrono (Observable/Promise) renderizzato con pipe async
  Async,

  // Valore calcolato tramite una funzione customValueFn definita in configurazione
  CustomValueFn
}
