export enum ExpandableRowModeEnum {
  // Il contenuto espanso viene mostrato direttamente sotto la riga
  Inline,

  // I dati della riga figlia provengono da una proprietà dell’entità (es. entity.children)
  RelationProperty,

  // I dati della riga figlia vengono recuperati tramite una funzione esterna (provider)
  EntitiesProvider
}
