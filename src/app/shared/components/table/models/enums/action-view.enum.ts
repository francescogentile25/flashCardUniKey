export enum ActionViewEnum {
  // Mostra i pulsanti con etichetta testuale
  Buttons = 'buttons',

  // Mostra solo pulsanti icona
  IconButtons = 'icon-buttons',

  // Mostra un menu a tendina con le azioni
  Menu = 'menu',

  // Mostra uno split button (azione principale + menu secondario)
  Split = 'split',

  // Mostra alcune azioni inline e le restanti nel menu
  Hybrid = 'hybrid',

  // Permette di usare un template HTML personalizzato
  Custom = 'custom'
}
