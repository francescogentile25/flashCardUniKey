import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'as',
  standalone: true
})
export class AsPipe implements PipeTransform {

  transform<T>(value: any, _type: (new (...args: any[]) => T) | T): T | undefined {
    if (!value) return undefined;
    return value as T;
  }

}
