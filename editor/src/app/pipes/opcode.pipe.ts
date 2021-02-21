import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'opcode',
})
export class OpcodePipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): unknown {
    return value.toString(16).padStart(4, '0').toUpperCase();
  }
}
