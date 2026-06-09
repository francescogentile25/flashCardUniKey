import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[stringToPhone]'
})
export class StringToPhone {

  private readonly maxLength = 10;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Rimuovi tutto ciò che non è una cifra
    value = value.replace(/\D/g, '');

    // Limita a 10 caratteri
    if (value.length > this.maxLength) {
      value = value.slice(0, this.maxLength);
    }

    // Aggiorna il valore se è cambiato
    if (input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    // Permetti: backspace, delete, tab, escape, enter, home, end, arrow keys
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)
    ) {
      return;
    }

    // Permetti: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey || event.metaKey) {
      if (['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
        return;
      }
    }

    // Blocca se non è un numero (0-9)
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Blocca se ha già raggiunto 10 caratteri (a meno che non ci sia testo selezionato)
    if (input.value.length >= this.maxLength && !input.selectionStart !== !input.selectionEnd) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';

    // Estrai solo i numeri dal testo incollato
    const numericText = pastedText.replace(/\D/g, '').slice(0, this.maxLength);

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value;

    // Inserisci il testo numerico nella posizione corretta
    input.value = (
      currentValue.slice(0, start) +
      numericText +
      currentValue.slice(end)
    ).slice(0, this.maxLength);

    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Posiziona il cursore dopo il testo incollato
    const newCursorPos = start + numericText.length;
    input.setSelectionRange(newCursorPos, newCursorPos);
  }

}
