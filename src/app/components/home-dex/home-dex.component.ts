import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, Renderer2, ElementRef, AfterViewInit } from '@angular/core';
import { HomeDexService } from '../../services/home-dex.service';

import { pokemonSimpleInterface } from '../../interfaces/pokemonSimpleInterface';
import { pokemonApiSimpleInterface } from '../../interfaces/pokemonApiSimpleInterface';
import { pokemonApiInterface } from '../../interfaces/pokemonApiInterface';
import { pokemonInterface } from '../../interfaces/pokemonInterface';
import { typesJson } from '../../interfaces/typesJson';
import { ALLOWED_STATES, PokemonState, ALLOWED_VALUES, AllowedValue, pokemonLocalStorageInterface, HomeLocalStorageInterface, gameList, gameNames, GameName } from '../../interfaces/pokemonLocalStorage';

import * as homeList from '../../../../public/templates/home-template.json';
import * as formList from '../../../../public/templates/form-template.json';
import * as regionalList from '../../../../public/templates/regional-template.json';
import * as femaleList from '../../../../public/templates/female-template.json';
import * as types from '../../../../public/templates/types-template.json';

import { FormatNamePipe } from '../../pipe/format-name/format-name.pipe';
import { FormatNumberPipe } from '../../pipe/format-number/format-number.pipe';
import { LocalStorageService } from '../../services/local-storage.service';
import { pokemonInfoInterface } from '../../interfaces/pokemonInfoInterface';
import { exit } from 'node:process';
import { TypesInterface } from '../../interfaces/typesInterface';


@Component({
  selector: 'app-home-dex',
  imports: [FormatNamePipe, FormatNumberPipe],
  templateUrl: './home-dex.component.html',
  styleUrl: './home-dex.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})


export class HomeDexComponent implements OnInit, AfterViewInit {

  currentLanguage: 'en' | 'es' = 'en';
  private storageData: HomeLocalStorageInterface | null = null;
  storageList: pokemonInterface[] = [];
  showList: pokemonInterface[] = [];
  pokemonInfo: pokemonInfoInterface | null = null;
  searchQuery: string = '';

  pokemonHome: pokemonInterface[] = (homeList as any).default;
  pokemonForms: pokemonInterface[] = (formList as any).default;
  pokemonRegionals: pokemonInterface[] = (regionalList as any).default;
  pokemonFemales: pokemonInterface[] = (femaleList as any).default;
  typeList: TypesInterface[] = (types as any).default;

  shinyPage: boolean = false;
  pokedex: null | 'national' | 'form' | 'regional' | 'female' = null;
  order: boolean = false;

  filterState: PokemonState | null = null;
  filterGame: GameName | null = null;
  filterNote: boolean | null = null;

  // formTitles: boolean = false;
  countCaught: number = 0;
  countAll: number = 0;
  countCaughtSection: number = 0;
  countAllSection: number = 0;
  percentageBarSection: number = 0;

  progressPokedex = [
    { name: 'National', reference: ALLOWED_VALUES[10], progress: 0, function: () => this.changeShowList('national') },
    { name: 'Form', reference: ALLOWED_VALUES[11], progress: 0, function: () => this.changeShowList('form') },
    { name: 'Regional', reference: ALLOWED_VALUES[12], progress: 0, function: () => this.changeShowList('regional') },
    { name: 'Female', reference: ALLOWED_VALUES[13], progress: 0, function: () => this.changeShowList('female') }
  ];


  stateList = [
    { name: 'Uncaught', value: ALLOWED_STATES[0], img: '/symbols/Uncaught.png', count: 0 },
    { name: 'Caught', value: ALLOWED_STATES[1], img: '/symbols/Caught.png', count: 0 },
    { name: 'Wanted', value: ALLOWED_STATES[2], img: '/symbols/Wanted.png', count: 0 },
    { name: 'Stored', value: ALLOWED_STATES[3], img: '/symbols/Stored.png', count: 0 },
    { name: 'Evolve', value: ALLOWED_STATES[4], img: '/symbols/Evolve.png', count: 0 },
    { name: 'Change', value: ALLOWED_STATES[5], img: '/symbols/Change.png', count: 0 },
  ];

  titleList = [
    { name: 'National', number: 0, value: ALLOWED_VALUES[10] },
    { name: 'Gen 1', number: 1, value: ALLOWED_VALUES[1] },
    { name: 'Gen 2', number: 2, value: ALLOWED_VALUES[2] },
    { name: 'Gen 3', number: 3, value: ALLOWED_VALUES[3] },
    { name: 'Gen 4', number: 4, value: ALLOWED_VALUES[4] },
    { name: 'Gen 5', number: 5, value: ALLOWED_VALUES[5] },
    { name: 'Gen 6', number: 6, value: ALLOWED_VALUES[6] },
    { name: 'Gen 7', number: 7, value: ALLOWED_VALUES[7] },
    { name: 'Gen 8', number: 8, value: ALLOWED_VALUES[8] },
    { name: 'Gen 9', number: 9, value: ALLOWED_VALUES[9] },
  ];

  gameList = gameList;

  constructor(private homeDexService: HomeDexService, private localStorageService: LocalStorageService, private cdr: ChangeDetectorRef, private renderer: Renderer2, private el: ElementRef) { }

  async ngOnInit(): Promise<void> {
    this.localStorageService.language$.subscribe((language) => {
      this.currentLanguage = language;
    });
    this.shinyPage = this.localStorageService.checkShinyPage();
    try {
      await Promise.all([
        this.createHomeLS(this.shinyPage),
        this.loadStorageData(this.shinyPage),
        this.order = this.getOrderLS(),
      ]);
      console.log('Datos cargados completamente');
    } catch (error) {
      console.error('Error durante la carga de datos:', error);
    }
  }

  async ngAfterViewInit(): Promise<void> {
    this.updateProgressPokedex();
    this.getFilterLS('all');
    this.updateShowList(this.localStorageService.checkHomeSectionLS());
    this.getCountCaughtPokedex(this.shinyPage);
    this.getCountAllPokedex(this.shinyPage);
  }


  ngAfterViewChecked(): void {
    const titles = this.el.nativeElement.querySelectorAll('.gen-title');
    titles.forEach((title: HTMLElement) => {
      if (title.classList.contains('animate-slide-in')) {
        this.renderer.removeClass(title, 'animate-slide-in');
      }
      this.renderer.addClass(title, 'animate-slide-in');
    });
  }

  changeShinyPage(): void {
    this.shinyPage = !this.shinyPage;
    this.createHomeLS(this.shinyPage);

    if (this.pokemonInfo) {
      this.pokemonInfo = null
    }

    this.localStorageService.checkShinyPage(this.shinyPage);
    this.loadStorageData(this.shinyPage);
    this.getCountCaughtPokedex(this.shinyPage);
    this.getCountAllPokedex(this.shinyPage);
    this.updateProgressPokedex();
    const storedData = localStorage.getItem('home-section');

    if (storedData !== 'none') {
      let section: string | number | null = storedData;
      if (storedData !== null && !isNaN(Number(storedData))) {
        section = Number(storedData);
      }
      this.getCountCaughtPokedex(this.shinyPage, section as AllowedValue);
      this.getCountAllPokedex(this.shinyPage, section as AllowedValue);
      this.getSectionPercentageBar(this.countCaughtSection, this.countAllSection)
    } else {
      this.getSectionPercentageBar(this.countCaught, this.countAll)
    }

    this.getFilterLS('all');
    if (this.filterGame !== null || this.filterNote !== null || this.filterState !== null || this.searchQuery.length >= 3) {
      this.filterShowList();
    }

    this.triggerContainerAnimation();
  }

  async createHomeLS(shinyPage: boolean): Promise<void> {

    const localStorageName = shinyPage ? 'home-shiny' : 'home-normal';
    const storedData = localStorage.getItem(localStorageName);

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);

        // Validar y ordenar las listas
        const validatedData = {
          page: parsedData.page || localStorageName,
          type: {
            national: this.validateAndSortList(parsedData.type.national, this.pokemonHome),
            form: this.validateAndSortList(parsedData.type.form, this.pokemonForms),
            regional: this.validateAndSortList(parsedData.type.regional, this.pokemonRegionals),
            female: this.validateAndSortList(parsedData.type.female, this.pokemonFemales),
          }
        };

        localStorage.setItem(localStorageName, JSON.stringify(validatedData));
        console.log(`El localStorage '${localStorageName}' ha sido validado y actualizado.`);
        return;
      } catch (error) {
        console.error(`Error al validar '${localStorageName}':`, error);
        localStorage.removeItem(localStorageName);
      }
    }

    const national = this.transformPokemonList(this.pokemonHome);
    const form = this.transformPokemonList(this.pokemonForms);
    const regional = this.transformPokemonList(this.pokemonRegionals);
    const female = this.transformPokemonList(this.pokemonFemales);

    const initialData = {
      page: localStorageName,
      type: {
        national: national,
        form: form,
        regional: regional,
        female: female
      }
    };

    localStorage.setItem(localStorageName, JSON.stringify(initialData));
    console.log(`Se ha creado el localStorage '${localStorageName}'.`);

  }

  private validateAndSortList(
    storedList: pokemonLocalStorageInterface[],
    referenceList: pokemonInterface[]
  ): pokemonLocalStorageInterface[] {
    const storedMap = new Map(storedList.map(p => [p.id, p]));

    const completeList: pokemonLocalStorageInterface[] = referenceList.map(pokemon => {
      const storedData = storedMap.get(pokemon.id);

      if (storedData) {
        return {
          id: storedData.id,
          state: this.validateState(storedData.state),
          game: this.validateGame(storedData.game),
          note: this.validateNote(storedData.note),
        };
      }

      console.log(`ID ${pokemon.id} no existía. Se ha añadido con valores predeterminados.`);
      return {
        id: pokemon.id,
        state: 'Uncaught',
        game: 'None',
        note: '',
      };
    });

    return completeList;
  }

  private validateState(state: string): PokemonState {
    if (ALLOWED_STATES.includes(state as PokemonState)) {
      return state as PokemonState;
    } else {
      console.log("Valor de State Actualizado a Uncaught")
      return 'Uncaught';
    }
  }

  private validateGame(game: string): GameName {
    if (gameNames.includes(game as GameName)) {
      return game as GameName;
    } else {
      console.log("Valor de Game Actualizado a None")
      return 'None';
    }
  }

  private validateNote(note: string): string {
    if (note.length > 40) {
      console.log("Valor de Note Demasiado Largo (+40 caracteres)")
    return note.slice(0, 40);
    } else {
      return note;
    }
  }

  loadStorageData(shinyPage: boolean) {
    const localStorageName = shinyPage ? 'home-shiny' : 'home-normal';
    const storedData = localStorage.getItem(localStorageName);

    if (storedData) {
      this.storageData = JSON.parse(storedData) as HomeLocalStorageInterface;
    } else {
      console.error(`No se encontraron datos en localStorage para '${localStorageName}'.`);
    }
  }

  getCountCaughtPokedex(shinyPage?: boolean, section?: AllowedValue): void {
    const storage = this.storageData;

    if (!storage) {
      console.warn('No storage data available');
      this.countCaught = 0;
      this.countCaughtSection = 0;
      return;
    }

    let caughtCount = 0;

    if (section && section in storage.type) {

      caughtCount = storage.type[section as keyof typeof storage.type]
        .filter((pokemon) => pokemon.state === 'Caught').length;
      this.countCaughtSection = caughtCount;

    } else if (section && typeof section === 'number') {
      const nationalPokemon = storage.type.national;
      let offset = 0;
      let limit = 0;

      switch (section) {
        case 1:
          offset = 0;
          limit = 151;
          break;
        case 2:
          offset = 151;
          limit = 100;
          break;
        case 3:
          offset = 251;
          limit = 135;
          break;
        case 4:
          offset = 386;
          limit = 107;
          break;
        case 5:
          offset = 493;
          limit = 156;
          break;
        case 6:
          offset = 649;
          limit = 72;
          break;
        case 7:
          offset = 721;
          limit = 88;
          break;
        case 8:
          offset = 809;
          limit = 96;
          break;
        case 9:
          offset = 905;
          limit = 120;
          break;
        default:
          console.warn('Section number is out of range');
          return;
      }
      caughtCount = nationalPokemon
        .slice(offset, offset + limit)
        .filter((pokemon) => pokemon.state === 'Caught').length;
      this.countCaughtSection = caughtCount;

    } else {
      caughtCount = Object.values(storage.type).reduce((count, pokemonArray) => {
        return count + pokemonArray.filter((pokemon) => pokemon.state === 'Caught').length;
      }, 0);
      this.countCaught = caughtCount;
    }
  }

  getCountAllPokedex(shinyPage?: boolean, section?: AllowedValue): void {
    const storage = this.storageData;
    if (!storage) {
      console.warn('No storage data available');
      this.countAll = 0;
      this.countAllSection = 0;
      return;
    }

    let allCount = 0;

    if (section && section in storage.type) {
      allCount = storage.type[section as keyof typeof storage.type].length;
      this.countAllSection = allCount;
    } else if (section && typeof section === 'number') {
      const nationalPokemon = storage.type.national;
      let offset = 0;
      let limit = 0;

      switch (section) {
        case 1:
          offset = 0;
          limit = 151;
          break;
        case 2:
          offset = 151;
          limit = 100;
          break;
        case 3:
          offset = 251;
          limit = 135;
          break;
        case 4:
          offset = 386;
          limit = 107;
          break;
        case 5:
          offset = 493;
          limit = 156;
          break;
        case 6:
          offset = 649;
          limit = 72;
          break;
        case 7:
          offset = 721;
          limit = 88;
          break;
        case 8:
          offset = 809;
          limit = 96;
          break;
        case 9:
          offset = 905;
          limit = 120;
          break;
        default:
          console.warn('Section number is out of range');
          return;
      }
      allCount = nationalPokemon.slice(offset, offset + limit).length;
      this.countAllSection = allCount;
    } else {
      allCount = Object.values(storage.type).reduce((count, pokemonArray) => {
        return count + pokemonArray.length;
      }, 0);
      this.countAll = allCount;
    }
  }

  getSectionPercentage(section: 'national' | 'regional' | 'female' | 'form'): number {
    const storage = this.storageData;

    if (!storage || !storage.type[section]) {
      console.warn(`No data available for section: ${section}`);
      return 0;
    }

    const pokemonArray = storage.type[section];
    const caughtCount = pokemonArray.filter((pokemon) => pokemon.state === 'Caught').length;
    const percentage = (caughtCount / pokemonArray.length) * 100;

    return isNaN(percentage) ? 0 : Math.round(percentage);
  }

  updateProgressPokedex() {
    this.progressPokedex.forEach((entry) => {
      const percentage = this.getSectionPercentage(entry.reference as 'national' | 'form' | 'regional' | 'female');
      entry.progress = percentage;
    });
  }

  transformPokemonList(list: pokemonInterface[]): pokemonLocalStorageInterface[] {
    return list.map(pokemon => ({
      id: pokemon.id,
      state: 'Uncaught',
      game: 'None',
      note: ''
    }));
  }

  changeShowList(section: AllowedValue) {
    if (section === this.pokedex) {
      this.updateShowList("none")
    } else {
      this.updateShowList(section)
    }
  }

  transformList(offset: number, limit: number): any[] {
    if (!Array.isArray(this.pokemonHome)) {
      console.error('pokemonHome no es un array.');
      return [];
    }

    if (offset < 0 || limit <= 0) {
      console.error('Offset o limit no son válidos.');
      return [];
    }

    return this.pokemonHome.slice(offset, offset + limit);
  }

  async updateShowList(section: AllowedValue): Promise<void> {
    if (typeof section === 'string' && !isNaN(Number(section))) {
      section = Number(section) as AllowedValue;
    }
    if (section != null) {
      try {
        switch (section) {
          case "national":
            this.localStorageService.setSectionLS("national");
            this.pokedex = 'national'
            this.storageList = this.pokemonHome;
            break;
          case "regional":
            this.localStorageService.setSectionLS("regional");
            this.pokedex = 'regional'
            this.storageList = this.pokemonRegionals;
            break;
          case "female":
            this.localStorageService.setSectionLS("female");
            this.pokedex = 'female'
            this.storageList = this.pokemonFemales;
            break;
          case "form":
            this.localStorageService.setSectionLS("form");
            this.pokedex = 'form'
            this.storageList = this.pokemonForms;
            break;
          case 1:
            this.localStorageService.setSectionLS(1);
            this.pokedex = 'national'
            this.storageList = this.transformList(0, 151);
            break;
          case 2:
            this.localStorageService.setSectionLS(2);
            this.pokedex = 'national'
            this.storageList = this.transformList(151, 100);
            break;
          case 3:
            this.localStorageService.setSectionLS(3);
            this.pokedex = 'national'
            this.storageList = this.transformList(251, 135);
            break;
          case 4:
            this.localStorageService.setSectionLS(4);
            this.pokedex = 'national'
            this.storageList = this.transformList(386, 107);
            break;
          case 5:
            this.localStorageService.setSectionLS(5);
            this.pokedex = 'national'
            this.storageList = this.transformList(493, 156);
            break;
          case 6:
            this.localStorageService.setSectionLS(6);
            this.pokedex = 'national'
            this.storageList = this.transformList(649, 72);
            break;
          case 7:
            this.localStorageService.setSectionLS(7);
            this.pokedex = 'national'
            this.storageList = this.transformList(721, 88);
            break;
          case 8:
            this.localStorageService.setSectionLS(8);
            this.pokedex = 'national'
            this.storageList = this.transformList(809, 96);
            break;
          case 9:
            this.localStorageService.setSectionLS(9);
            this.pokedex = 'national'
            this.storageList = this.transformList(905, 120);
            break;
          default:
            this.localStorageService.setSectionLS('none');
            this.pokedex = null
            this.storageList = this.pokemonHome.concat(
              this.pokemonForms,
              this.pokemonRegionals,
              this.pokemonFemales,
            );
            break;
        }
        // this.showList = this.storageList;
        this.showList = [...this.storageList];
        if (this.filterGame !== null || this.filterNote !== null || this.filterState !== null || this.searchQuery.length >= 3) {
          this.filterShowList();
        }
        this.cdr.detectChanges();
        this.triggerContainerAnimation();
        this.selectedPokedex(this.pokedex);
        // this.selectedState(this.filterState);
        if (section === 'national') {
          this.selectedTitle(0)
        } else if (typeof section === 'number') {
          this.selectedTitle(section)
        }

        if (section !== 'none') {
          this.getCountCaughtPokedex(this.shinyPage, section);
          this.getCountAllPokedex(this.shinyPage, section);
          this.getSectionPercentageBar(this.countCaughtSection, this.countAllSection)
        } else {
          this.getCountCaughtPokedex(this.shinyPage);
          this.getCountAllPokedex(this.shinyPage);
          this.getSectionPercentageBar(this.countCaught, this.countAll)
        }
        this.updateOrder(true);
        this.cdr.detectChanges();
      } catch (err) {
        console.log("ShowGen" + err);
      }
    }

  }

  updateFilters(newFilter: PokemonState | GameName | boolean, type: 'state' | 'game' | 'note'): void {

    if (ALLOWED_STATES.includes(newFilter as PokemonState)) {

      if (newFilter === this.filterState) {
        this.filterState = null;
      } else {
        this.filterState = newFilter as PokemonState;
      }
      this.setFilterLS("state");
      this.selectedState(this.filterState as PokemonState);

    } else if (type === 'game') {

      if (newFilter === this.filterGame) {
        this.filterGame = null;
      } else {
        this.filterGame = newFilter as GameName;
      }
      this.setFilterLS("game");
      this.selectedGame(this.filterGame);

    } else if (type === 'note') {

      if (newFilter === this.filterNote) {
        this.filterNote = null;
      } else {
        this.filterNote = newFilter as boolean;
      }
      this.setFilterLS("note");
      this.selectedNote(this.filterNote);

    } else {
      console.log("Filtro no valido");
    }
    console.log("filtro:" + this.filterState + " " + this.filterGame + " " + this.filterNote)
    this.filterShowList();
  }

  async filterShowList(): Promise<void> {
    if (!this.storageList || !this.storageData) return;

    const query = this.searchQuery?.trim().toLowerCase() || '';

    const translatedQuery = this.typeList.find((typeEntry) =>
      typeEntry.type.toLowerCase() === query || typeEntry.es.toLowerCase() === query)?.type.toLowerCase();

    const filteredList = this.storageList.filter((pokemon) => {
      if (this.storageData) {
        const typeData = this.storageData.type[pokemon.section];
        const matchingEntry = typeData?.find((entry) => entry.id === pokemon.id);

        if (!matchingEntry) return false;

        let isStateMatch = true;
        let isGameMatch = true;
        let isNoteMatch = true;

        if (this.filterState && this.filterState !== null) {
          isStateMatch = matchingEntry.state === this.filterState;
        }

        if (this.filterGame && this.filterGame !== null) {
          isGameMatch = matchingEntry.game === this.filterGame;
        }

        if (typeof this.filterNote === 'boolean') {
          if (this.filterNote) {
            isNoteMatch = matchingEntry.note !== '';
          } else {
            isNoteMatch = matchingEntry.note === '';
          }
        }

        if (translatedQuery) {
          const isTypeMatch = pokemon.type1.toLowerCase() === translatedQuery || pokemon.type2?.toLowerCase() === translatedQuery;
          return isTypeMatch && isStateMatch && isGameMatch && isNoteMatch;
        }

        // Si query no coincide con un tipo, aplica lógica normal
        const isSearchMatch =
          query.length < 3 || new RegExp(query.split('').join('.*'), 'i').test(pokemon.name);

        return isStateMatch && isGameMatch && isNoteMatch && isSearchMatch;


      } else {
        console.error('No storage data available');
        return false;
      }
    });

    this.showList = filteredList;
    this.cdr.detectChanges();
  }


  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.filterShowList();
  }

  titleSelected: number = 0;
  selectedTitle(n: number): void {
    for (let i = 0; i <= 9; i++) {
      const element = this.renderer.selectRootElement(`#gen-title-${i}`, true);
      this.renderer.removeClass(element, 'title-selected');
    }
    this.titleSelected = n;
    const selectedElement = this.renderer.selectRootElement(`#gen-title-${n}`, true);
    this.renderer.addClass(selectedElement, 'title-selected');
  }

  selectedPokedex(identifier: string | null): void {
    const identifiers = ['national', 'form', 'regional', 'female'];
    identifiers.forEach(id => {
      const element = this.renderer.selectRootElement(`#pokedex-option-${id}`, true);
      this.renderer.removeClass(element, 'item-selected');
    });

    const selectedElement = this.el.nativeElement.querySelector(`#pokedex-option-${identifier}`);
    if (selectedElement) {
      this.renderer.addClass(selectedElement, 'item-selected');
    }
  }

  selectedState(identifier: PokemonState | null): void {
    const identifiers = ALLOWED_STATES;
    identifiers.forEach(id => {
      const element = this.renderer.selectRootElement(`#state-option-${id}`, true);
      this.renderer.removeClass(element, 'item-selected');
    });

    const selectedElement = this.el.nativeElement.querySelector(`#state-option-${identifier}`);
    if (selectedElement) {
      this.renderer.addClass(selectedElement, 'item-selected');
    }
  }

  selectedGame(identifier: GameName | null) {
    const identifiers = gameNames;
    identifiers.forEach(id => {
      const element = this.renderer.selectRootElement(`#game-option-${id}`, true);
      this.renderer.removeClass(element, 'item-selected');
    });

    const selectedElement = this.el.nativeElement.querySelector(`#game-option-${identifier}`);
    if (selectedElement) {
      console.log("aqui")
      this.renderer.addClass(selectedElement, 'item-selected');
      this.cdr.detectChanges();
    }
  }

  selectedNote(identifier: boolean | null) {
    const identifiers = ['true', 'false'];
    identifiers.forEach(id => {
      const element = this.renderer.selectRootElement(`#note-option-${id}`, true);
      this.renderer.removeClass(element, 'item-selected');
    });
    if (identifier === true) {
      const selectedElement = this.el.nativeElement.querySelector(`#note-option-true`);
      if (selectedElement) {
        this.renderer.addClass(selectedElement, 'item-selected');
      }

    } else if (identifier === false) {
      const selectedElement = this.el.nativeElement.querySelector(`#note-option-false`);
      if (selectedElement) {
        this.renderer.addClass(selectedElement, 'item-selected');
      }
    }

  }

  triggerContainerAnimation() {
    const container = this.el.nativeElement.querySelector('.pokemon-container');
    if (container) {
      this.renderer.removeClass(container, 'animate-fade-in');
      void container.offsetWidth;
      this.renderer.addClass(container, 'animate-fade-in');
    }
  }

  setPokemonInfo(pokemon: pokemonInterface): void {

    this.isDropdownOpenInfoGame = false;
    this.isDropdownOpenInfoState = false;
    const lsData: pokemonLocalStorageInterface | null = this.getPokemonLS(pokemon.id, pokemon.section, this.shinyPage);
    if (!lsData) {
      console.warn(`No se pudo encontrar información en el localStorage para el Pokémon con ID ${pokemon.id}`);
      this.pokemonInfo = null;
      return;
    }

    this.pokemonInfo = {
      ...pokemon,
      shiny: this.shinyPage,
      state: lsData.state,
      game: lsData.game,
      note: lsData.note,
    };
  }

  updatePokemonInfoState(pokemon: pokemonInfoInterface, newState: PokemonState) {
    this.setPokemonStateLS(pokemon.id, pokemon.section, newState, pokemon.shiny);
    pokemon.state = newState;
    this.pokemonInfo = pokemon;
  }

  updatePokemonInfoGame(pokemon: pokemonInfoInterface, newGame: GameName) {
    this.setPokemonGameLS(pokemon.id, pokemon.section, newGame, pokemon.shiny);
    pokemon.game = newGame;
    this.pokemonInfo = pokemon;
  }

  isButtonClicked = false;
  updatePokemonInfoNote(pokemon: pokemonInfoInterface) {
    this.isButtonClicked = true;
    const textarea = document.getElementById('textarea-info') as HTMLTextAreaElement;
    const newNote = textarea?.value || '';
    this.setPokemonNoteLS(pokemon.id, pokemon.section, newNote, pokemon.shiny);
    pokemon.note = newNote;
    this.pokemonInfo = pokemon;
    setTimeout(() => {
      this.isButtonClicked = false;
    }, 100);
  }

  getPokemonLS(id: number, section: string, shinyPage: boolean): pokemonLocalStorageInterface | null {
    const localStorageName = shinyPage ? 'home-shiny' : 'home-normal';
    const localStorageData = localStorage.getItem(localStorageName);

    if (!localStorageData) {
      console.warn(`No se encontró el almacenamiento local para ${localStorageName}`);
      return null;
    }

    const parsedData: HomeLocalStorageInterface = JSON.parse(localStorageData);
    const sectionData = parsedData.type[section as keyof HomeLocalStorageInterface['type']];

    if (!sectionData) {
      console.warn(`Sección ${section} no encontrada en localStorage`);
      return null; // Devuelve valores por defecto
    }

    const pokemonData = sectionData.find((item: pokemonLocalStorageInterface) => item.id === id);

    if (!pokemonData) {
      console.warn(`Pokémon con ID ${id} no encontrado en la sección ${section}`);
      return null; // Devuelve valores por defecto
    }

    return pokemonData;
  }

  setFilterLS(type: 'state' | 'game' | 'note') {
    switch (type) {
      case 'state':
        if (this.filterState !== null && this.filterState !== undefined) {
          localStorage.setItem('home-filterState', this.filterState as PokemonState);
        } else {
          localStorage.removeItem('home-filterState');
        }
        break;
      case 'game':
        if (this.filterGame !== null && this.filterGame !== undefined) {
          localStorage.setItem('home-filterGame', this.filterGame as GameName);
        } else {
          localStorage.removeItem('home-filterGame');
        }
        break;
      case 'note':
        if (this.filterNote !== null && this.filterNote !== undefined) {
          localStorage.setItem('home-filterNote', String(this.filterNote));
        } else {
          localStorage.removeItem('home-filterNote');
        }
        break;
      default:
        console.error('Invalid type provided to setFilterLS');
    }
  }

  getFilterLS(type: 'state' | 'game' | 'note' | 'all') {
    switch (type) {
      case 'state':
        const stateValue = localStorage.getItem('home-filterState');
        this.filterState = stateValue ? stateValue as PokemonState : null;
        this.selectedState(this.filterState);
        break;
      case 'game':
        const gameValue = localStorage.getItem('home-filterGame');
        this.filterGame = gameValue ? gameValue as GameName : null;
        this.selectedGame(this.filterGame);
        break;
      case 'note':
        const noteValue = localStorage.getItem('home-filterNote');
        if (noteValue === null) {
          this.filterNote = null;
        } else if (noteValue === 'true') {
          this.filterNote = true;
        } else if (noteValue === 'false') {
          this.filterNote = false;
        }
        this.selectedNote(this.filterNote);
        break;
      case 'all':
        this.getFilterLS('state');
        this.getFilterLS('game');
        this.getFilterLS('note');
        break;
      default:
        console.error('Invalid type provided to getFilterLS');
        break;
    }
  }

  getPokemonStateLS(id: number, section: null | 'national' | 'form' | 'regional' | 'female'): PokemonState {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return 'Uncaught';
    }
    if (section !== null) {
      const typeData = this.storageData.type[section] as pokemonLocalStorageInterface[];
      const pokemon = typeData.find((p) => p.id === id);
      return pokemon ? (pokemon.state as PokemonState) : 'Uncaught';
    } else {
      return 'Uncaught'
    }

  }

  setPokemonStateLS(id: number, section: 'national' | 'form' | 'regional' | 'female', newState: PokemonState, shiny: boolean) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoState = false;
    const typeData = this.storageData.type[section] as pokemonLocalStorageInterface[];
    const pokemon = typeData.find((p) => p.id === id);
    if (this.pokemonInfo) {
      this.pokemonInfo.state = newState
    }
    if (pokemon) {
      pokemon.state = newState;
      this.saveStorageData(shiny);
      this.getCountCaughtPokedex(shiny);
      this.updateProgressPokedex();
      this.filterShowList();
      const storedData = localStorage.getItem('home-section');

      if (storedData !== 'none') {
        let section: string | number | null = storedData;
        if (storedData !== null && !isNaN(Number(storedData))) {
          section = Number(storedData);
        }
        this.getCountCaughtPokedex(this.shinyPage, section as AllowedValue);
        this.getCountAllPokedex(this.shinyPage, section as AllowedValue);
        this.getSectionPercentageBar(this.countCaughtSection, this.countAllSection);
      } else {
        this.getSectionPercentageBar(this.countCaught, this.countAll);
      }

    } else {
      console.error(`No se encontró un Pokémon con ID ${id} en la lista ${this.pokedex}.`);
    }
  }

  setPokemonGameLS(id: number, section: 'national' | 'form' | 'regional' | 'female', newGame: GameName, shiny: boolean) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoGame = false;
    const typeData = this.storageData.type[section] as pokemonLocalStorageInterface[];
    const pokemon = typeData.find((p) => p.id === id);
    if (this.pokemonInfo) {
      this.pokemonInfo.game = newGame
    }
    if (pokemon) {
      pokemon.game = newGame;
      this.saveStorageData(shiny);
      this.filterShowList();
    } else {
      console.error(`No se encontró un Pokémon con ID ${id} en la lista ${this.pokedex}.`);
    }
  }

  setPokemonNoteLS(id: number, section: 'national' | 'form' | 'regional' | 'female', newGame: string, shiny: boolean) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoState = false;
    this.isDropdownOpenInfoGame = false;
    const typeData = this.storageData.type[section] as pokemonLocalStorageInterface[];
    const pokemon = typeData.find((p) => p.id === id);
    if (this.pokemonInfo) {
      this.pokemonInfo.note = newGame
    }
    if (pokemon) {
      pokemon.note = newGame;
      this.saveStorageData(shiny);
      this.filterShowList();
    } else {
      console.error(`No se encontró un Pokémon con ID ${id} en la lista ${this.pokedex}.`);
    }
  }

  setPokemonStateDC(id: number, section: 'national' | 'form' | 'regional' | 'female', state: PokemonState, shiny: boolean) {
    let newState: PokemonState
    if (state === ALLOWED_STATES[1]) {
      newState = ALLOWED_STATES[0]
    } else {
      newState = ALLOWED_STATES[1]
    }
    this.setPokemonStateLS(id, section, newState, shiny)
  }

  saveStorageData(shiny: boolean) {
    const localStorageName = shiny ? 'home-shiny' : 'home-normal';
    if (this.storageData) {
      localStorage.setItem(localStorageName, JSON.stringify(this.storageData));
    }
  }


  hoveredCardId: number | null = null;
  hoveredCardSection: 'national' | 'form' | 'regional' | 'female' | null = null
  hoverPosition: string = 'bottom';
  hoverAlignment: string = '';
  onCardHover(pokemonId: number | null, section: 'national' | 'form' | 'regional' | 'female'): void {
    this.hoveredCardId = pokemonId;
    this.hoveredCardSection = section;
    const card = document.getElementById(`pokemon-card-${section}-${pokemonId}`);
    if (card) {
      const rect = card.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;

      if (screenHeight - rect.bottom < 200) {
        this.hoverPosition = 'top';
      } else {
        this.hoverPosition = 'bottom';
      }

      if (rect.left < 340) {
        this.hoverAlignment = 'left';
      } else if (screenWidth - rect.right < 100) {
        this.hoverAlignment = 'right';
      } else {
        this.hoverAlignment = '';
      }
    }
  }
  onCardMouseLeave(): void {
    this.hoveredCardId = null;
    this.hoverPosition = 'bottom';
    this.hoverAlignment = '';
  }

  getTypeColor(type: string): string {
    const typeInfo = this.typeList.find(t => t.type === type); return typeInfo ? typeInfo.background : '#000000';
  }

  isDropdownOpenDex = false;
  isDropdownOpenState = false;
  isDropdownOpenGames = false;
  isDropdownOpenInfoState = false;
  isDropdownOpenInfoGame = false;
  isDropdownOpenNote = false;
  toggleDropdown(dropdown: number): void {
    switch (dropdown) {
      case 1:
        this.isDropdownOpenDex = !this.isDropdownOpenDex;
        break;
      case 2:
        this.isDropdownOpenState = !this.isDropdownOpenState;
        break;
      case 3:
        this.isDropdownOpenGames = !this.isDropdownOpenGames;
        break;
      case 4:
        this.isDropdownOpenNote = !this.isDropdownOpenNote;
        break;
      case 5:
        this.isDropdownOpenInfoState = !this.isDropdownOpenInfoState;
        this.isDropdownOpenInfoGame = false;
        break;
      case 6:
        this.isDropdownOpenInfoGame = !this.isDropdownOpenInfoGame;
        this.isDropdownOpenInfoState = false;
        break;
    }
  }

  changeOrder() {

    if (this.order === true) {
      this.order = false;
    } else {
      this.order = true;
    }
    if (this.order) {
      localStorage.setItem('home-order', String(this.order))
    } else {
      localStorage.removeItem('home-order')
    }
    this.updateOrder();
  }

  updateOrder(show?: boolean) {
    if (this.order === true) {

      this.showList.sort((a, b) => a.original_id - b.original_id);
      this.triggerContainerAnimation();

    } else {
      if (!show) {
        this.updateShowList(this.localStorageService.checkHomeSectionLS());
      }
    }
  }

  getOrderLS(): boolean {
    const orderLS = localStorage.getItem('home-order');
    if (orderLS) {
      return true
    } else {
      return false
    }
  }

  closePokemonInfo(): void {
    this.pokemonInfo = null
  }

  getBackgroundByGameName(gameName: string): string {
    const game = gameList.find(g => g.name === gameName);
    return game ? game.background : '';
  }

  getSectionPercentageBar(min: number, all: number) {
    this.percentageBarSection = all > 0
      ? parseFloat(((min / all) * 100).toFixed(2))
      : 0;
  }

  onImageError(event: Event, id?: number): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/home/0.png';
  }
}

