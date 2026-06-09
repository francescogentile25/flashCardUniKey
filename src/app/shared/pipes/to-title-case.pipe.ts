import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toTitleCase',
  standalone: true
})
export class ToTitleCasePipe implements PipeTransform {

  transform(value: string): string {
    const result = value
      .replace(/(_)+/g, ' ')
      .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
      .replace(/([A-Z][a-z])([A-Z])/g, "$1 $2")
      .replace(/([a-z])([A-Z]+[a-z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z][a-z])/g, "$1 $2")
      .replace(/([a-z]+)([A-Z0-9]+)/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-rt-z][a-z]*)/g, "$1 $2")
      .replace(/([a-z])([0-9])/g, "$1 $2")
      .replace(/([0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([0-9]+)/g, "$1 $2")
      .replace(/([0-9]+)([A-Z])/g, "$1 $2")
      .trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

}
