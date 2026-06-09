import { Pipe, PipeTransform } from '@angular/core';
import { getNestedValue } from "../../core/utils/get-nested-value.util";

@Pipe({
  name: 'nestedValue',
  standalone: true
})
export class NestedValuePipe implements PipeTransform {

  transform(obj: any, path: string): any {
    return getNestedValue(obj, path);
  }

}
