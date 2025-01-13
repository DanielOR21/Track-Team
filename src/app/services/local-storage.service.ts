import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ALLOWED_NUMBERS, ALLOWED_STATES, ALLOWED_VALUES, AllowedNumbers, AllowedValue, pokemonLocalStorageInterface, PokemonState } from '../interfaces/pokemonLocalStorage';
import { BehaviorSubject } from 'rxjs';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.languageSubject.next(this.getLanguageLS());
    }
  }

  private readonly localStorageKey = 'main-language';
  private languageSubject = new BehaviorSubject<'en' | 'es'>(this.getLanguageLS());

  language$ = this.languageSubject.asObservable();

  setLanguageLS(newLng: 'en' | 'es'): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.localStorageKey, newLng);
      this.languageSubject.next(newLng);
    }
  }

  getLanguageLS(): 'en' | 'es' {
    if (isPlatformBrowser(this.platformId)) {
      const storedLanguage = localStorage.getItem(this.localStorageKey);
      return storedLanguage === 'es' ? 'es' : 'en';
    }
    return 'en';
  }


  checkHomeSectionLS(): AllowedValue {
    const key = 'home-section';
    const storedValue = localStorage.getItem(key);
    const isValid = (value: any): value is typeof ALLOWED_VALUES[number] => {
      return ALLOWED_VALUES.includes(isNaN(+value) ? value : +value);
    };

    if (!storedValue || !isValid(storedValue)) {
      const defaultValue: AllowedValue = 'none';
      localStorage.setItem(key, defaultValue.toString());
      console.log(`'section' no era válido o no existía. Se ha inicializado con '${defaultValue}'.`);
      return defaultValue;
    }
    return storedValue

  }

  checkMoveSectionLS(): AllowedNumbers {
    const key = 'move-section';
    const storedValue = localStorage.getItem(key);
    const isValid = (value: any): value is typeof ALLOWED_NUMBERS[number] => {
      return ALLOWED_VALUES.includes(isNaN(+value) ? value : +value);
    };

    if (!storedValue || !isValid(storedValue)) {
      const defaultValue: AllowedNumbers = 0;
      localStorage.setItem(key, defaultValue.toString());
      console.log(`'section' no era válido o no existía. Se ha inicializado con '${defaultValue}'.`);
      return defaultValue;
    }
    return storedValue

  }

  checkAbilitySectionLS(): AllowedNumbers {
    const key = 'ability-section';
    const storedValue = localStorage.getItem(key);
    const isValid = (value: any): value is typeof ALLOWED_NUMBERS[number] => {
      return ALLOWED_VALUES.includes(isNaN(+value) ? value : +value);
    };

    if (!storedValue || !isValid(storedValue)) {
      const defaultValue: AllowedNumbers = 0;
      localStorage.setItem(key, defaultValue.toString());
      console.log(`'section' no era válido o no existía. Se ha inicializado con '${defaultValue}'.`);
      return defaultValue;
    }
    return storedValue

  }

  checkShinyPage(value?: boolean): boolean {
    // Verificar si localStorage está disponible en este entorno
    if (typeof localStorage === 'undefined') {
      console.error('localStorage no está disponible en este entorno.');
      return false;
    }

    // Si el valor no existe, inicializamos 'shiny' en localStorage con "false"
    if (!localStorage.getItem('home-shiny-dex')) {
      localStorage.setItem('home-shiny-dex', 'false');
    }

    // Si se pasa un booleano como argumento, actualizamos el valor en localStorage
    if (typeof value === 'boolean') {
      localStorage.setItem('home-shiny-dex', String(value));
    }

    // Recuperamos el valor actual de 'shiny' y lo retornamos como booleano
    return localStorage.getItem('home-shiny-dex') === 'true';
  }

  getStateByIdLS(shiny:boolean, id:number): PokemonState {
    const localpoke = this.getPokemonByIdLS(shiny, id)
    if(localpoke){
      return localpoke.state
    }else{
      return ALLOWED_STATES[0]
    }
  }

  getPokemonByIdLS(shiny:boolean, id: number): pokemonLocalStorageInterface | null {

    const localData =  shiny ? 'home-shiny' : 'home-normal';
  
    if (!localData) {
      console.warn(`No se encontró '${localData}' en el localStorage.`);
      return null; // Retorna null si no existe
    }
  
    const parsedData = JSON.parse(localData);
  
    // Asegurarse de que el formato del objeto sea válido
    if (!parsedData.type || !Array.isArray(parsedData.type.dex)) {
      console.error(`Formato inválido para '${localData}'.`);
      return null; // Retorna null si el formato es incorrecto
    }
  
    const foundPokemon = parsedData.type.dex.find((pokemon: pokemonLocalStorageInterface) => pokemon.id === id);
  
    if (!foundPokemon) {
      console.warn(`No se encontró un Pokémon con ID ${id} en '${localData}'.`);
      return null; // Retorna null si no se encuentra
    }
  
    return foundPokemon; // Retorna el Pokémon encontrado
  }

  setSectionLS(value: AllowedValue): void {
    localStorage.setItem('home-section', String(value)); // Convertimos el valor a string si es necesario
    console.log(`Valor de 'section' actualizado a: ${value}`);
  }

  setMoveSectionLS(value: AllowedNumbers): void {
    localStorage.setItem('move-section', String(value)); // Convertimos el valor a string si es necesario
    console.log(`Valor de 'section' actualizado a: ${value}`);
  }

  setAbilitySectionLS(value: AllowedNumbers): void {
    localStorage.setItem('ability-section', String(value)); // Convertimos el valor a string si es necesario
    console.log(`Valor de 'section' actualizado a: ${value}`);
  }
}
