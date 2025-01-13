import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatNumber'
})
export class FormatNumberPipe implements PipeTransform {

  transform(value: number): string {
    // Convierte el número a una cadena con el formato #0000
    const formattedNumber = value.toString().padStart(4, '0');
    return `${formattedNumber}`;
  }

}
