import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'asBool',
  standalone: true
})
export class AsBoolPipe implements PipeTransform {

  transform(value: any): boolean {
    return value === true || value === 1 || String(value).trim().toLowerCase() === 'true' || String(value).trim() === '1';
  }

}
