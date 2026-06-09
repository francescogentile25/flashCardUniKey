export enum ActionTypeEnum {
  // Esegue una funzione sincrona
  Fn = 'fn',

  // Esegue una funzione asincrona (Promise o Observable)
  AsyncFn = 'async',

  // Effettua una navigazione interna tramite router
  Route = 'route',

  // Avvia il download di un file
  Download = 'download',

  // Apre un link esterno
  External = 'external'
}
