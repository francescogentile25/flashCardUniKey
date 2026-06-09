import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fn',
  standalone: true
})
export class FnPipe implements PipeTransform {

  transform<T, K>(data: T, func: (entity: T) => K): K {
    return func(data);
  }

}
