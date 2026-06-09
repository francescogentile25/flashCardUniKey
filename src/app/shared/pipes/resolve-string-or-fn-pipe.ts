import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'resolveStringOrFn',
  standalone: true
})
export class ResolveStringOrFnPipe<T> implements PipeTransform {

  transform(property: string | ((data: T | undefined) => string) | undefined, data?: T): string {
    if (!property) {
      return '';
    }
    // Caso 1: property è una stringa
    if (typeof property === 'string') {
      return property;
    }

    // Caso 2: property è una funzione (data => string)
    return property(data) ?? '';
  }

}
