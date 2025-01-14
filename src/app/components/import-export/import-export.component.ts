import { Component, OnInit, Renderer2 } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { ALLOWED_STATES, PokemonState, gameNames, GameName, pokemonLocalStorageInterface, HomeLocalStorageInterface } from '../../interfaces/pokemonLocalStorage';
import { pokemonInterface } from '../../interfaces/pokemonInterface';

import * as homeList from '../../../assets/templates/home-template.json';
import * as formList from '../../../assets/templates/form-template.json';
import * as regionalList from '../../../assets/templates/regional-template.json';
import * as femaleList from '../../../assets/templates/female-template.json';

@Component({
  selector: 'app-import-export',
  imports: [],
  templateUrl: './import-export.component.html',
  styleUrl: './import-export.component.css'
})
export class ImportExportComponent implements OnInit {

  buttons = [
    { name: 'Home-normal', reference: 'home-normal', es: 'Home-normal' },
    { name: 'Home-shiny', reference: 'home-shiny', es: 'Home-shiny' },
    { name: 'Moves', reference: 'move-storage', es: 'Movimientos' },
    { name: 'Abilities', reference: 'ability-storage', es: 'Habilidades' },
  ];

  currentLanguage: 'en' | 'es' = 'en';
  selectedButton: string | null = null;
  storageData: string = '';
  isValidJson: boolean = true;

  pokemonHome: pokemonInterface[] = (homeList as any).default;
  pokemonForms: pokemonInterface[] = (formList as any).default;
  pokemonRegionals: pokemonInterface[] = (regionalList as any).default;
  pokemonFemales: pokemonInterface[] = (femaleList as any).default;

  constructor(private localStorageService: LocalStorageService, private renderer: Renderer2) { }



  ngOnInit(): void {
    this.localStorageService.language$.subscribe((language) => {
      this.currentLanguage = language;
    });

  }

  updateSelectedButton(button: string | null) {

    this.buttons.forEach((btn) => {
      const element = this.renderer.selectRootElement(`#button-${btn.reference}`, true);
      this.renderer.removeClass(element, 'selected-item');
    });

    if (this.selectedButton === button) {
      this.selectedButton = null;
    } else if (button) {
      this.selectedButton = button;
      const selectedElement = this.renderer.selectRootElement(`#button-${button}`, true);
      this.renderer.addClass(selectedElement, 'selected-item');
      this.storageData = localStorage.getItem(button) || '';
    }

  }

  validateJson(): void {
    try {
      JSON.parse(this.storageData);
      this.isValidJson = true;
    } catch {
      this.isValidJson = false;
    }
  }

  copyToClipboard(): void {
    const textarea = document.getElementById('jsonTextarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.select(); // Selecciona el contenido del textarea
      document.execCommand('copy'); // Copia el contenido al portapapeles
      alert('Contenido copiado al portapapeles.');
    } else {
      console.error('El elemento textarea no se encontró.');
    }
  }

  updateLocalStorage(): void {
    if (!this.selectedButton) {
      console.log('Selecciona una Lista');
      return;
    }

    if (!this.isValidJson) {
      console.error('El JSON no es válido. Corrige los datos antes de actualizar.');
      return;
    }

    const textarea = this.renderer.selectRootElement('#jsonTextarea', true);
    const newStorageData = textarea.value;

    if (newStorageData.trim() === '') {
      alert('El campo no puede estar vacío.');
      return;
    }

    switch (this.selectedButton) {
      case 'home-normal':
        const validatedNormalData = this.validateHomeLS(newStorageData, false);
        if (validatedNormalData) {
          localStorage.setItem('home-normal', JSON.stringify(validatedNormalData));
          console.log('LocalStorage para home-normal actualizado:', validatedNormalData);
        }
        break;

      case 'home-shiny':
        const validatedShinyData = this.validateHomeLS(this.storageData, true);
        if (validatedShinyData) {
          localStorage.setItem('home-shiny', JSON.stringify(validatedShinyData));
          console.log('LocalStorage para home-shiny actualizado:', validatedShinyData);
        }
        break;

      case 'move-storage':
        // Implementa la validación para movimientos aquí
        console.log('Validación de move-storage pendiente.');
        break;

      case 'ability-storage':
        // Implementa la validación para habilidades aquí
        console.log('Validación de ability-storage pendiente.');
        break;

      default:
        console.error('Selecciona una Lista Válida');
        break;
    }
  }

  validateHomeLS(storageData: string, shinyPage: boolean): HomeLocalStorageInterface | null {
    try {
      const parsedData: Partial<HomeLocalStorageInterface> = JSON.parse(storageData);

      const localStorageName = shinyPage ? 'home-shiny' : 'home-normal';
      const errors: string[] = [];

      // Validar la propiedad `page`
      if (parsedData.page !== localStorageName) {
        errors.push(`El valor de "page" es inválido. Se esperaba "${localStorageName}".`);
      }

      // Inicializar las listas obligatorias si no están presentes
      const type = {
        national: parsedData.type?.national || [],
        form: parsedData.type?.form || [],
        regional: parsedData.type?.regional || [],
        female: parsedData.type?.female || []
      };

      // Listas válidas por tipo
      const lists = {
        national: this.pokemonHome,
        form: this.pokemonForms,
        regional: this.pokemonRegionals,
        female: this.pokemonFemales
      };

      // Validar las secciones
      const validateSection = (section: pokemonLocalStorageInterface[], type: keyof typeof lists): pokemonLocalStorageInterface[] => {
        const validList = lists[type];

        return section.map((pokemon) => {
          const validId = validList.some(p => p.id === pokemon.id) ? pokemon.id : 0;

          if (validId === 0) {
            errors.push(`ID inválido encontrado en la sección "${type}": ${pokemon.id}`);
          }

          return {
            id: validId,
            state: this.validatePokemonState(pokemon.state),
            game: this.validateGame(pokemon.game),
            note: this.validateNote(pokemon.note)
          };
        });
      };

      // Validar cada sección
      const validatedType = {
        national: validateSection(type.national, 'national'),
        form: validateSection(type.form, 'form'),
        regional: validateSection(type.regional, 'regional'),
        female: validateSection(type.female, 'female'),
      };

      // Si hay errores, muestra una alerta y no actualiza
      if (errors.length > 0) {
        alert(`Errores encontrados:\n- ${errors.join('\n- ')}`);
        return null;
      }

      // Retornar datos validados
      return {
        page: parsedData.page || localStorageName,
        type: validatedType
      };
    } catch (error) {
      alert('Error al procesar los datos: el JSON no es válido.');
      console.error('Error al validar HomeLocalStorageInterface:', error);
      return null;
    }
  }

  validatePokemonState = (state: string): PokemonState => {
    if (ALLOWED_STATES.includes(state as PokemonState)) {
      return state as PokemonState;
    }
    console.error(`Estado inválido: ${state}. Asignando 'Uncaught'.`);
    return 'Uncaught';
  };

  validateGame = (game: string): GameName => {
    if (gameNames.includes(game as GameName)) {
      return game as GameName;
    }
    console.error(`Juego inválido: ${game}. Asignando 'None'.`);
    return 'None';
  };

  validateNote = (note: string): string => {
    if (note.length > 40) {
      console.warn(`Nota demasiado larga. Reduciendo a 40 caracteres.`);
      return note.slice(0, 40);
    }
    return note;
  };



}
