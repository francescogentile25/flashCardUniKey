import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from "@angular/forms";

@Directive({
  selector: 'input[trimSpaces], textarea[trimSpaces]',
})
export class TrimSpaces {

  constructor(
    private el: ElementRef<HTMLInputElement | HTMLTextAreaElement>,
    private control: NgControl
  ) {}

  @HostListener('blur')
  onBlur(): void {
    this.trimValue();
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    let value = input.value;

    // Rimuovi spazi multipli consecutivi (sostituisci con uno singolo)
    value = value.replace(/\s{2,}/g, ' ');

    // Aggiorna solo se è cambiato
    if (input.value !== value) {
      input.value = value;
      this.control.control?.setValue(value, { emitEvent: false });
    }
  }

  private trimValue(): void {
    const input = this.el.nativeElement;
    let value = input.value;

    if (!value) {
      return;
    }

    // Trim spazi iniziali e finali
    value = value.trim();

    // Rimuovi spazi multipli consecutivi
    value = value.replace(/\s{2,}/g, ' ');

    // Se il valore è solo spazi, svuota
    if (value === '' || /^\s*$/.test(value)) {
      value = '';
    }

    // Aggiorna input e form control
    if (input.value !== value) {
      input.value = value;
      this.control.control?.setValue(value);
      this.control.control?.updateValueAndValidity();
    }
  }

}
