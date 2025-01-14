import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { forkJoin, map } from 'rxjs';

import * as moves from '../../../../public/templates/move-template.json';
import * as learnMoves from '../../../../public/templates/move-pokemon-template.json';

import * as homeList from '../../../../public/templates/home-template.json';
import * as formList from '../../../../public/templates/form-template.json';
import * as regionalList from '../../../../public/templates/regional-template.json';
import * as femaleList from '../../../../public/templates/female-template.json';
import * as types from '../../../../public/templates/types-template.json';

import { MoveInterface } from '../../interfaces/moveInterface';
import { MoveInfoInterface } from '../../interfaces/moveInfoInterface';
import { HomeDexService } from '../../services/home-dex.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { ALLOWED_NUMBERS, AllowedNumbers, GameName, ITEM_STATES, itemListLocalStorageInterface, itemLocalStorageInterface, ItemState, gameList, gameNames } from '../../interfaces/pokemonLocalStorage';

import { FormatNamePipe } from '../../pipe/format-name/format-name.pipe';
import { MoveLearnInterface } from '../../interfaces/moveLearnInterface';
import { pokemonInterface } from '../../interfaces/pokemonInterface';
import { TypesInterface } from '../../interfaces/typesInterface';


@Component({
  selector: 'app-move-dex',
  imports: [FormatNamePipe],
  templateUrl: './move-dex.component.html',
  styleUrl: './move-dex.component.css'
})
export class MoveDexComponent implements OnInit, AfterViewInit {

  titleList = [
    { name: 'All', number: ALLOWED_NUMBERS[0] },
    { name: 'Gen 1', number: ALLOWED_NUMBERS[1] },
    { name: 'Gen 2', number: ALLOWED_NUMBERS[2] },
    { name: 'Gen 3', number: ALLOWED_NUMBERS[3] },
    { name: 'Gen 4', number: ALLOWED_NUMBERS[4] },
    { name: 'Gen 5', number: ALLOWED_NUMBERS[5] },
    { name: 'Gen 6', number: ALLOWED_NUMBERS[6] },
    { name: 'Gen 7', number: ALLOWED_NUMBERS[7] },
    { name: 'Gen 8', number: ALLOWED_NUMBERS[8] },
    { name: 'Gen 9', number: ALLOWED_NUMBERS[9] },
  ];

  stateList = [
    { name: 'Uncaught', value: ITEM_STATES[0], img: '/assets/symbols/Uncaught.png' },
    { name: 'Caught', value: ITEM_STATES[1], img: '/assets/symbols/Caught.png' },
    { name: 'Wanted', value: ITEM_STATES[2], img: '/assets/symbols/Wanted.png' },
  ];

  gameList = gameList;

  readonly nullPokemon: pokemonInterface = {
    id: 0,
    section: 'national',
    name: '',
    original_id: 0,
    type1: 'none',
    type2: 'none',
  }

  typeList: TypesInterface[] = (types as any).default;
  currentLanguage: 'en' | 'es' = 'en';

  private storageData: itemListLocalStorageInterface | null = null;
  storageList: MoveInterface[] = [];
  showList: MoveInterface[] = [];
  storagePokemonList: pokemonInterface[] = []
  showPokemonList: pokemonInterface[] = [];
  shinyPokemon: boolean = false;

  moveInfo: MoveInfoInterface | null = null;
  movePokemonInfo: boolean = false;

  pokemonHome: pokemonInterface[] = (homeList as any).default;
  pokemonForms: pokemonInterface[] = (formList as any).default;
  pokemonRegionals: pokemonInterface[] = (regionalList as any).default;
  pokemonFemales: pokemonInterface[] = (femaleList as any).default;

  searchQuery: string = '';
  searchPokemonQuery: string = '';
  filterState: ItemState | null = null;
  filterGame: GameName | null = null;
  filterNote: boolean | null = null;
  filterPokemon: boolean | null = null;

  countCaughtSection: number = 0;
  countAllSection: number = 0;
  percentageBarSection: number = 0;
  order: 'abc' | 'type' | 'both' | null = null

  moveSection: AllowedNumbers = 0;
  moveList: MoveInterface[] = (moves as any).default;
  moveLearnList: MoveLearnInterface[] = (learnMoves as any).default;
  // processedIds: { [originalId: number]: number } = {};

  constructor(private homeDexService: HomeDexService, private localStorageService: LocalStorageService, private cdr: ChangeDetectorRef, private renderer: Renderer2, private el: ElementRef) { }

  async ngOnInit(): Promise<void> {
    this.localStorageService.language$.subscribe((language) => {
      this.currentLanguage = language;
      if (this.filterGame !== null || this.filterNote !== null || this.filterState !== null || this.searchQuery.length >= 3) {
        this.filterShowList();
      }
      if (this.order) {
        this.updateOrder();
      }
    });

    this.initializeMoveLocalStorage();
    this.loadStorageData();
    this.order = this.getOrderLS();
    console.log(this.order)
  }

  async ngAfterViewInit(): Promise<void> {
    this.getFilterLS('all');
    this.moveSection = this.localStorageService.checkMoveSectionLS();
    await this.updateShowList(this.moveSection);
  }

  initializeMoveLocalStorage(): void {

    const existingStorage = localStorage.getItem('move-storage');

    if (existingStorage) {
      try {
        const parsedData = JSON.parse(existingStorage);

        const validatedData = {
          page: parsedData.page || 'ability',
          list: this.validateAndSortList(parsedData.list, this.moveList)
        };

        // Actualizar el localStorage con los datos validados y ordenados
        localStorage.setItem('ability-storage', JSON.stringify(validatedData));
        console.log(`El localStorage 'ability-storage' ha sido validado y actualizado.`);
        return;
      } catch (error) {
        console.error(`Error al validar 'ability-storage':`, error);
        // Si hay un error en el formato, eliminar el valor corrupto
        localStorage.removeItem('ability-storage');
      }
    }

    const filteredMoves = this.moveList.filter(move => move.home === true);
    const moveArray: itemLocalStorageInterface[] = filteredMoves.map(move => ({
      id: move.id,
      pokemon_id: 0,
      section: 'national',
      shiny: false,
      state: "Uncaught",
      game: "None",
      note: "",
    }));

    const moveLocalStorage: itemListLocalStorageInterface = {
      page: "move",
      list: moveArray,
    };

    localStorage.setItem('move-storage', JSON.stringify(moveLocalStorage));
    console.log('LocalStorage inicializado:', moveLocalStorage);
  }

  private validateAndSortList(
      storedList: itemLocalStorageInterface[],
      referenceList: MoveInterface[]
    ): itemLocalStorageInterface[] {
      const storedMap = new Map(storedList.map(p => [p.id, p]));
      const filteredReferenceList = referenceList.filter(move => move.home);
  
      const completeList: itemLocalStorageInterface[] = filteredReferenceList.map(move => {
        const storedData = storedMap.get(move.id);
        
        const validatePokemon = (pokemon_id: number, section: string, shiny: any): { pokemon_id: number; section: string; shiny: boolean } => {
          const isValidId = (id: number, list: pokemonInterface[]): boolean => list.some(p => p.id === id);
          if (!isNaN(pokemon_id)) {
          if (section === 'national') {
              if (isValidId(pokemon_id, this.pokemonHome)) {
                  return { pokemon_id, section: 'national', shiny: typeof shiny === 'boolean' ? shiny : false };
              }
          }
  
          if (section === 'form' && isValidId(pokemon_id, this.pokemonForms)) {
              return { pokemon_id, section: 'form', shiny: typeof shiny === 'boolean' ? shiny : false };
          }
  
          if (section === 'female' && isValidId(pokemon_id, this.pokemonFemales)) {
              return { pokemon_id, section: 'female', shiny: typeof shiny === 'boolean' ? shiny : false };
          }
  
          if (section === 'regional' && isValidId(pokemon_id, this.pokemonRegionals)) {
              return { pokemon_id, section: 'regional', shiny: typeof shiny === 'boolean' ? shiny : false };
          }
          
              if (isValidId(pokemon_id, this.pokemonHome)) return { pokemon_id, section: 'national', shiny: true };
              if (isValidId(pokemon_id, this.pokemonForms)) return { pokemon_id, section: 'form', shiny: true };
              if (isValidId(pokemon_id, this.pokemonFemales)) return { pokemon_id, section: 'female', shiny: true };
              if (isValidId(pokemon_id, this.pokemonRegionals)) return { pokemon_id, section: 'regional', shiny: true };
          }
  
          return { pokemon_id: 0, section: 'national', shiny: false };
      };
  
        if (storedData) {
  
          const { pokemon_id, section, shiny } = validatePokemon(storedData.pokemon_id, storedData.section, storedData.shiny);
  
          return {
            id: storedData.id,
            state: this.validateState(storedData.state),
            game: this.validateGame(storedData.game),
            note: this.validateNote(storedData.note),
            pokemon_id: pokemon_id,
            section: section === 'national' || section ===  'form' || section === 'female' || section === 'regional' ? section : 'national',
            shiny: shiny
          };
        }
  
        console.log(`ID ${move.id} no existía. Se ha añadido con valores predeterminados.`);
        return {
          id: move.id,
          state: 'Uncaught',
          game: 'None',
          note: '',
          pokemon_id: 0,
          section: 'national',
          shiny: false
        };
      });
  
      return completeList;
    }
  
    private validateState(state: string): ItemState {
      if (ITEM_STATES.includes(state as ItemState)) {
        return state as ItemState;
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

  loadStorageData() {
    const localStorageName = 'move-storage';
    const storedData = localStorage.getItem(localStorageName);

    if (storedData) {
      this.storageData = JSON.parse(storedData) as itemListLocalStorageInterface;
    } else {
      console.error(`No se encontraron datos en localStorage para '${localStorageName}'.`);
    }
  }

  async updateShowList(section: AllowedNumbers): Promise<void> {
    try {
      const sectionNumber = typeof section === 'string' ? +section : section;

      this.localStorageService.setMoveSectionLS(sectionNumber as AllowedNumbers);

      if (sectionNumber !== 0) {
        this.storageList = this.moveList.filter(
          (move) => move.generation === sectionNumber && move.home === true
        );
      } else {
        this.storageList = this.moveList.filter(
          (move) => move.home === true
        );
      }

      this.cdr.detectChanges();
      this.selectedTitle(sectionNumber);
      this.showList = this.storageList;

      this.getCountCaughtMove(section);
      this.getCountAllMove(section);
      this.getSectionPercentageBar(this.countCaughtSection, this.countAllSection)
      if (this.filterGame !== null || this.filterNote !== null || this.filterState !== null || this.searchQuery.length >= 3) {
        this.filterShowList();
      }
      this.updateOrder();
      this.triggerContainerAnimation();
      this.cdr.detectChanges();
    } catch (err) {
      console.log("updateMove" + err);
    }
  }

  getFilterLS(type: 'state' | 'game' | 'note' | 'pokemon' | 'all') {
    switch (type) {
      case 'state':
        const stateValue = localStorage.getItem('move-filterState');
        this.filterState = stateValue ? stateValue as ItemState : null;
        this.selectedState(this.filterState);
        break;
      case 'game':
        const gameValue = localStorage.getItem('move-filterGame');
        this.filterGame = gameValue ? gameValue as GameName : null;
        this.selectedGame(this.filterGame);
        break;
      case 'note':
        const noteValue = localStorage.getItem('move-filterNote');
        if (noteValue === null) {
          this.filterNote = null;
        } else if (noteValue === 'true') {
          this.filterNote = true;
        } else if (noteValue === 'false') {
          this.filterNote = false;
        }
        this.selectedNote(this.filterNote);
        break;
      case 'pokemon':
        const pokemonValue = localStorage.getItem('move-filterPokemon');
        if (pokemonValue === null) {
          this.filterPokemon = null;
        } else if (pokemonValue === 'true') {
          this.filterPokemon = true;
        } else if (pokemonValue === 'false') {
          this.filterPokemon = false;
        }
        this.selectedPokemon(this.filterPokemon);
        break;
      case 'all':
        this.getFilterLS('state');
        this.getFilterLS('game');
        this.getFilterLS('note');
        this.getFilterLS('pokemon');
        break;
      default:
        console.error('Invalid type provided to getFilterLS');
        break;
    }
  }

  setMoveInfo(move: MoveInterface): void {

    this.isDropdownOpenInfoGame = false;
    this.isDropdownOpenInfoState = false;
    const lsData: itemLocalStorageInterface | null = this.getMoveLS(move.id);
    if (!lsData) {
      console.warn(`No se pudo encontrar información en el localStorage para el Movimiento con ID ${move.id}`);
      this.moveInfo = null;
      return;
    }

    this.moveInfo = {
      ...move,
      pokemon_id: lsData.pokemon_id,
      shiny: lsData.shiny,
      section: lsData.section,
      state: lsData.state,
      game: lsData.game,
      note: lsData.note,
    };
  }

  stateMovePokemonInfo: 'learn' | 'all' = 'learn'
  showPokemonMoveInfo(string: 'toggle' | 'learn' | 'all') {
    if (string === 'toggle') {

      this.movePokemonInfo = !this.movePokemonInfo

    }

    if (this.movePokemonInfo && string === 'all') {

      this.stateMovePokemonInfo = 'all'

      const element = this.renderer.selectRootElement(`#move-info-title-learn`, true);
      this.renderer.removeClass(element, 'title-selected');

      const selectedElement = this.renderer.selectRootElement(`#move-info-title-all`, true);
      this.renderer.addClass(selectedElement, 'title-selected');

      this.storagePokemonList = this.pokemonHome.concat(
        this.pokemonRegionals,
        this.pokemonFemales,
        this.pokemonForms
      );

    } else if (this.movePokemonInfo) {
      this.stateMovePokemonInfo = 'learn'

      try {
        const element = this.renderer.selectRootElement(`#move-info-title-all`, true);
        this.renderer.removeClass(element, 'title-selected');

        const selectedElement = this.renderer.selectRootElement(`#move-info-title-learn`, true);
        this.renderer.addClass(selectedElement, 'title-selected');
      } catch (e) {

      }

      this.storagePokemonList = [];

      if (!this.moveInfo) {
        throw new Error('moveInfo is null or undefined');
      }

      const moveId = this.moveInfo.id;

      const move = this.moveLearnList.find(item => item.id === moveId);

      if (move) {

        move.learned_by_pokemon.forEach(pokemonId => {

          const foundInHome = this.pokemonHome.find(p => p.id === pokemonId);
          const foundInForms = this.pokemonForms.find(p => p.id === pokemonId);
          const foundInRegionals = this.pokemonRegionals.find(p => p.id === pokemonId);
          const foundInFemales = this.pokemonFemales.find(p => p.id === pokemonId);

          if (foundInHome) this.storagePokemonList.push(foundInHome);
          if (foundInForms) this.storagePokemonList.push(foundInForms);
          if (foundInRegionals) this.storagePokemonList.push(foundInRegionals);
          if (foundInFemales) this.storagePokemonList.push(foundInFemales);
        });
      }

    }

    if (!this.movePokemonInfo) {
      this.getSectionSelected();
    } else {
      this.showPokemonList = this.storagePokemonList;
      this.showPokemonList.sort((a, b) => a.original_id - b.original_id);
    }

    if (this.movePokemonInfo && this.searchPokemonQuery.length >= 3) {
      const query = this.searchPokemonQuery.trim();

      this.showPokemonList = this.storagePokemonList.filter((pokemon) => {

        const isSearchMatch = query.length < 3 ||
          new RegExp(query.split('').join('.*'), 'i').test(pokemon.name);

        return isSearchMatch;
      });
    }


  }

  getMoveLS(id: number): itemLocalStorageInterface | null {
    const localStorageName = 'move-storage';
    const localStorageData = localStorage.getItem(localStorageName);

    if (!localStorageData) {
      console.warn(`No se encontró el almacenamiento local para ${localStorageName}`);
      return null;
    }

    const parsedData: itemListLocalStorageInterface = JSON.parse(localStorageData);
    const sectionData = parsedData.list;

    if (!sectionData) {
      console.warn(`Sección no encontrada en localStorage`);
      return null;
    }

    const moveData = sectionData.find((item: itemLocalStorageInterface) => item.id === id);

    if (!moveData) {
      console.warn(`Movimiento con ID ${id} no encontrado`);
      return null;
    }

    return moveData;
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.filterShowList();
  }

  onSearchPokemon(event: Event): void {
    this.searchPokemonQuery = (event.target as HTMLInputElement).value;

    const query = this.searchPokemonQuery.trim();

    this.showPokemonList = this.storagePokemonList.filter((pokemon) => {

      const isSearchMatch = query.length < 3 ||
        new RegExp(query.split('').join('.*'), 'i').test(pokemon.name);

      return isSearchMatch;
    });
  }

  changeShiny(): void {
    this.shinyPokemon = !this.shinyPokemon;
  }

  updateFilters(newFilter: ItemState | GameName | boolean, type: 'state' | 'game' | 'note' | 'pokemon'): void {

    if (ITEM_STATES.includes(newFilter as ItemState)) {

      if (newFilter === this.filterState) {
        this.filterState = null;
      } else {
        this.filterState = newFilter as ItemState;
      }
      this.setFilterLS("state");
      this.selectedState(this.filterState as ItemState);

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

    } else if (type === 'pokemon') {

      if (newFilter === this.filterPokemon) {
        this.filterPokemon = null;
      } else {
        this.filterPokemon = newFilter as boolean;
      }
      this.setFilterLS("pokemon");
      this.selectedPokemon(this.filterPokemon);

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

    const filteredList = this.storageList.filter((move) => {
      if (this.storageData) {

        const typeData = this.storageData.list;
        const matchingEntry = typeData?.find((entry) => entry.id === move.id);

        if (!matchingEntry) return false;

        let isStateMatch = true;
        let isGameMatch = true;
        let isNoteMatch = true;
        let isPokemonMatch = true;

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

        if (typeof this.filterPokemon === 'boolean') {
          if (this.filterPokemon) {
            isPokemonMatch = matchingEntry.pokemon_id !== 0;
          } else {
            isPokemonMatch = matchingEntry.pokemon_id === 0;
          }
        }

        if (translatedQuery) {
          const isTypeMatch = move.type.toLowerCase() === translatedQuery;
          return isTypeMatch && isStateMatch && isGameMatch && isNoteMatch;
        }

        const isDamageMatch = query && (move.damage_class.toLowerCase() === query);
        if (query === 'status' || query === 'physical' || query === 'special') {
          return isDamageMatch && isStateMatch && isGameMatch && isNoteMatch && isPokemonMatch;
        }

        if (this.currentLanguage === 'en') {
          const isSearchMatch =
            query.length < 3 || new RegExp(query.split('').join('.*'), 'i').test(move.languaje[0].en);

          return isStateMatch && isGameMatch && isNoteMatch && isPokemonMatch && isSearchMatch;
        } else if (this.currentLanguage === 'es') {
          const isSearchMatch =
            query.length < 3 || new RegExp(query.split('').join('.*'), 'i').test(move.languaje[1].es);

          return isStateMatch && isGameMatch && isNoteMatch && isPokemonMatch && isSearchMatch;
        } else {
          return
        }

      } else {
        console.log('kk');
        return false;
      }
    });

    this.showList = filteredList;
    this.updateOrder();
    this.cdr.detectChanges();
  }

  setFilterLS(type: 'state' | 'game' | 'note' | 'pokemon') {
    switch (type) {
      case 'state':
        if (this.filterState !== null && this.filterState !== undefined) {
          localStorage.setItem('move-filterState', this.filterState as ItemState);
        } else {
          localStorage.removeItem('move-filterState');
        }
        break;
      case 'game':
        if (this.filterGame !== null && this.filterGame !== undefined) {
          localStorage.setItem('move-filterGame', this.filterGame as GameName);
        } else {
          localStorage.removeItem('move-filterGame');
        }
        break;
      case 'note':
        if (this.filterNote !== null && this.filterNote !== undefined) {
          localStorage.setItem('move-filterNote', String(this.filterNote));
        } else {
          localStorage.removeItem('move-filterNote');
        }
        break;
      case 'pokemon':
        if (this.filterPokemon !== null && this.filterPokemon !== undefined) {
          localStorage.setItem('move-filterPokemon', String(this.filterPokemon));
        } else {
          localStorage.removeItem('move-filterPokemon');
        }
        break;
      default:
        console.error('Invalid type provided to setFilterLS');
    }
  }

  selectedState(identifier: ItemState | null): void {
    const identifiers = ITEM_STATES;
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

  selectedPokemon(identifier: boolean | null) {
    const identifiers = ['true', 'false'];
    identifiers.forEach(id => {
      const element = this.renderer.selectRootElement(`#pokemon-option-${id}`, true);
      this.renderer.removeClass(element, 'item-selected');
    });
    if (identifier === true) {
      const selectedElement = this.el.nativeElement.querySelector(`#pokemon-option-true`);
      if (selectedElement) {
        this.renderer.addClass(selectedElement, 'item-selected');
      }

    } else if (identifier === false) {
      const selectedElement = this.el.nativeElement.querySelector(`#pokemon-option-false`);
      if (selectedElement) {
        this.renderer.addClass(selectedElement, 'item-selected');
      }
    }

  }

  titleSelected: number = 0;
  selectedTitle(n: number): void {
    for (let i = 0; i <= 9; i++) {
      const element = this.renderer.selectRootElement(`#move-title-${i}`, true);
      this.renderer.removeClass(element, 'title-selected');
    }
    this.titleSelected = n;
    const selectedElement = this.renderer.selectRootElement(`#move-title-${n}`, true);
    this.renderer.addClass(selectedElement, 'title-selected');
  }

  triggerContainerAnimation() {
    const container = this.el.nativeElement.querySelector('.move-container');
    if (container) {
      this.renderer.removeClass(container, 'animate-fade-in');
      void container.offsetWidth;
      this.renderer.addClass(container, 'animate-fade-in');
    }
  }

  getTypeColor(type: string): string {
    const typeInfo = this.typeList.find(t => t.type === type); return typeInfo ? typeInfo.background : '#000000';
  }

  changeOrder() {

    if (this.order === 'abc') {
      this.order = 'type';
    } else if (this.order === 'type') {
      this.order = 'both';
    } else if (this.order === 'both') {
      this.order = null;
    } else {
      this.order = 'abc';
    }
    if (this.order) {
      localStorage.setItem('move-order', this.order)
    } else {
      localStorage.removeItem('move-order')
    }
    this.updateOrder();
  }

  updateOrder() {
    if (this.order === 'type') {
      const typeOrder = this.typeList.map(t => t.type);

      this.showList.sort((a, b) => a.id - b.id);

      this.showList.sort((a, b) => {
        const typeAIndex = typeOrder.indexOf(a.type);
        const typeBIndex = typeOrder.indexOf(b.type);

        return typeAIndex - typeBIndex;
      });

    } else if (this.order === 'abc') {

      if (this.currentLanguage === 'es') {
        this.showList.sort((a, b) => a.languaje[1].es.localeCompare(b.languaje[1].es));
      } else if (this.currentLanguage === 'en') {
        this.showList.sort((a, b) => a.languaje[0].en.localeCompare(b.languaje[0].en));
      }

    } else if (this.order === 'both') {

      if (this.currentLanguage === 'es') {
        this.showList.sort((a, b) => a.languaje[1].es.localeCompare(b.languaje[1].es));
      } else if (this.currentLanguage === 'en') {
        this.showList.sort((a, b) => a.languaje[0].en.localeCompare(b.languaje[0].en));
      }

      const typeOrder = this.typeList.map(t => t.type);
      this.showList.sort((a, b) => {
        const typeAIndex = typeOrder.indexOf(a.type);
        const typeBIndex = typeOrder.indexOf(b.type);

        return typeAIndex - typeBIndex;
      });
    } else {
      this.showList.sort((a, b) => a.id - b.id);
    }
  }

  getOrderLS(): 'abc' | 'type' | 'both' | null {
    const orderLS = localStorage.getItem('move-order');
    if (orderLS === 'abc' || orderLS === 'type' || orderLS === 'both') {
      return orderLS
    } else {
      return null
    }
  }

  isDropdownOpenPokemon = false;
  isDropdownOpenState = false;
  isDropdownOpenGames = false;
  isDropdownOpenInfoState = false;
  isDropdownOpenInfoGame = false;
  isDropdownOpenNote = false;
  toggleDropdown(dropdown: number): void {
    switch (dropdown) {
      case 1:
        this.isDropdownOpenPokemon = !this.isDropdownOpenPokemon;
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

  saveStorageData() {
    const localStorageName = 'move-storage'
    if (this.storageData) {
      localStorage.setItem(localStorageName, JSON.stringify(this.storageData));
    }
  }

  getMoveStateLS(id: number): ItemState {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return 'Uncaught';
    }
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const move = typeData.find((p) => p.id === id);
    return move ? (move.state as ItemState) : 'Uncaught';
  }

  setMoveStateLS(id: number, newState: ItemState) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoState = false;
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const move = typeData.find((p) => p.id === id);
    if (this.moveInfo) {
      this.moveInfo.state = newState
    }
    if (move) {
      move.state = newState;
      this.saveStorageData();
      this.filterShowList();
      const storedData = localStorage.getItem('move-section');

      let section: AllowedNumbers = storedData ? Number(storedData) as AllowedNumbers : 0;

      this.getCountCaughtMove(section);
      this.getCountAllMove(section);
      this.getSectionPercentageBar(this.countCaughtSection, this.countAllSection)


    } else {
      console.error(`No se encontró un Movimiento con ID ${id} en la lista.`);
    }
  }

  setMoveGameLS(id: number, newGame: GameName) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoGame = false;
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const move = typeData.find((p) => p.id === id);
    if (this.moveInfo) {
      this.moveInfo.game = newGame
    }
    if (move) {
      move.game = newGame;
      this.saveStorageData();
      this.filterShowList();
    } else {
      console.error(`No se encontró un Movimiento con ID ${id} en la lista.`);
    }
  }

  setMoveNoteLS(id: number, newNote: string) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoState = false;
    this.isDropdownOpenInfoGame = false;
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const move = typeData.find((p) => p.id === id);
    if (this.moveInfo) {
      this.moveInfo.note = newNote
    }
    if (move) {
      move.note = newNote;
      this.saveStorageData();
      this.filterShowList();
    } else {
      console.error(`No se encontró un Movimiento con ID ${id} en la lista.`);
    }
  }

  setMovePokemonLS(id: number, newPokemon: pokemonInterface, shiny: boolean) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const move = typeData.find((p) => p.id === id);
    if (this.moveInfo) {
      this.moveInfo.pokemon_id = newPokemon.id;
      this.moveInfo.section = newPokemon.section;
      this.moveInfo.shiny = shiny;
    }
    if (move) {
      move.pokemon_id = newPokemon.id;
      move.section = newPokemon.section;
      move.shiny = shiny;
      this.saveStorageData();
      this.filterShowList();
    } else {
      console.error(`No se encontró un Movimiento con ID ${id} en la lista.`);
    }
  }

  updateMoveInfoState(move: MoveInfoInterface, newState: ItemState) {
    this.setMoveStateLS(move.id, newState);
    move.state = newState;
    this.moveInfo = move;
  }

  updateMoveInfoGame(move: MoveInfoInterface, newGame: GameName) {
    this.setMoveGameLS(move.id, newGame);
    move.game = newGame;
    this.moveInfo = move;
  }

  updateMoveInfoPokemon(move: MoveInfoInterface, newPokemon: pokemonInterface) {
    if (move.pokemon_id === newPokemon.id && move.section === newPokemon.section && move.shiny === this.shinyPokemon) {
      this.setMovePokemonLS(move.id, this.nullPokemon, false);
      move.pokemon_id = this.nullPokemon.id;
      move.section = this.nullPokemon.section;
      move.shiny = false;
      this.moveInfo = move
    } else {
      this.setMovePokemonLS(move.id, newPokemon, this.shinyPokemon);
      move.pokemon_id = newPokemon.id;
      move.section = newPokemon.section;
      move.shiny = this.shinyPokemon;
      this.moveInfo = move
    }
  }

  isButtonClicked = false;
  updateMoveInfoNote(move: MoveInfoInterface) {
    this.isButtonClicked = true;
    const textarea = document.getElementById('textarea-info-move') as HTMLTextAreaElement;
    const newNote = textarea?.value || '';
    this.setMoveNoteLS(move.id, newNote);
    move.note = newNote;
    this.moveInfo = move;
    setTimeout(() => {
      this.isButtonClicked = false;
    }, 100);
  }

  getCountCaughtMove(section: AllowedNumbers): void {
    const storage = this.storageData;

    if (!storage || !this.storageList || this.storageList.length === 0) {
      console.warn('No storage data available');
      this.countCaughtSection = 0;
      return;
    }

    let caughtCount = 0;

    if (section === 0) {

      caughtCount = storage.list.filter((move) => move.state === 'Caught').length;

    }  else {

      caughtCount = storage.list.filter((move) => {
        const item = this.storageList.find((item) => item.id === move.id);
        return (
          move.state === 'Caught' &&
          item &&
          item.generation === Number(section) &&
          item.home === true
        );
      }).length;
    }
    this.countCaughtSection = caughtCount;
  }

  getCountAllMove(section: AllowedNumbers): void {
    const storage = this.storageData;

    if (!storage) {
      console.warn('No storage data available');
      this.countAllSection = 0;
      return;
    }

    let allCount = 0;

    if (section === 0) {

      allCount = storage.list.length;
      this.countAllSection = allCount;

    }  else {
      allCount = storage.list.filter((move) => {
        const item = this.storageList.find((item) => item.id === move.id);
        return (
          item &&
          item.generation === Number(section) &&
          item.home === true
        );
      }).length;
      this.countAllSection = allCount;
    }
  }

  getSectionPercentageBar(min: number, all: number) {
    this.percentageBarSection = all > 0
      ? parseFloat(((min / all) * 100).toFixed(2))
      : 0;
  }

  setMoveStateDC(id: number, state: ItemState) {
      let newState: ItemState
      if (state === ITEM_STATES[1]) {
        newState = ITEM_STATES[0]
      } else {
        newState = ITEM_STATES[1]
      }
      this.setMoveStateLS(id, newState)
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

  getSectionSelected() {
    const storedData = localStorage.getItem('move-section');
    let section: number = storedData ? Number(storedData) : 0;
    this.cdr.detectChanges();
    this.selectedTitle(section)
  }

  getBackgroundByGameName(gameName: string): string {
    const game = gameList.find(g => g.name === gameName);
    return game ? game.background : '';
  }

  closeMoveInfo(): void {
    this.moveInfo = null
    this.searchPokemonQuery = ''
    this.shinyPokemon = false
    this.movePokemonInfo = false
    this.getSectionSelected();
  }

  onImageError(event: Event, id?: number): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/assets/home/0.png';
  }

  // getLearnedByPokemon(moves: { id: number }[]): void {
  //   // Crea una lista de observables para cada movimiento
  //   const requests = moves.map((move) =>
  //     this.homeDexService.getMoveApi(move.id).pipe(
  //       map((response: any) => {
  //         const pokemonIds = response.learned_by_pokemon.map((pokemon: { url: string }) => {
  //           const urlParts = pokemon.url.split('/');
  //           return parseInt(urlParts[urlParts.length - 2], 10);
  //         });

  //         return {
  //           id: move.id,
  //           learned_by_pokemon: pokemonIds,
  //         };
  //       })
  //     )
  //   );

  //   // Usa forkJoin para esperar a que todas las solicitudes terminen
  //   forkJoin(requests).subscribe({
  //     next: (results) => {
  //       console.log(results);
  //     },
  //     error: (err) => {
  //       console.error('Error procesando movimientos:', err);
  //     },
  //   });
  // }
  // async processPokemonIds(): Promise<void> {
  //   for (const move of this.moveLearnList) {
  //     const learnedByPokemon = move.learned_by_pokemon;

  //     for (let i = 0; i < learnedByPokemon.length; i++) {
  //       const pokemonId = learnedByPokemon[i];

  //       // Verifica si ya existe en el mapa
  //       if (this.processedIds[pokemonId] !== undefined) {
  //         // Usa el valor almacenado en el mapa
  //         learnedByPokemon[i] = this.processedIds[pokemonId];
  //       } else if (pokemonId > 10000) {
  //         try {
  //           // Llama a la API para obtener los datos
  //           const data = await this.homeDexService
  //             .getPokemonApi(pokemonId)
  //             .toPromise();

  //           const forms = data.forms;

  //           if (forms.length > 1) {
  //             console.warn(
  //               `El Pokémon con ID ${pokemonId} tiene múltiples formas.`,
  //               forms
  //             );
  //           }

  //           const newId = this.extractIdFromUrl(forms[0].url);

  //           // Actualiza el valor en el JSON y lo guarda en el mapa
  //           learnedByPokemon[i] = newId;
  //           this.processedIds[pokemonId] = newId;
  //         } catch (error) {
  //           console.error(`Error procesando el ID ${pokemonId}:`, error);
  //         }
  //       }
  //     }
  //   }
  // }

  // private extractIdFromUrl(url: string): number {
  //   const parts = url.split('/');
  //   return parseInt(parts[parts.length - 2], 10);
  // }

}
