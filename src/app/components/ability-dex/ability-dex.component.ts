import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { forkJoin, map } from 'rxjs';

import * as abilities from '../../../assets/templates/ability-template.json';
import * as learnAbilities from '../../../assets/templates/ability-pokemon-template.json';
import * as homeList from '../../../assets/templates/home-template.json';
import * as formList from '../../../assets/templates/form-template.json';
import * as regionalList from '../../../assets/templates/regional-template.json';
import * as femaleList from '../../../assets/templates/female-template.json';
import * as types from '../../../assets/templates/types-template.json';

import { HomeDexService } from '../../services/home-dex.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { ALLOWED_NUMBERS, AllowedNumbers, gameList, GameName, gameNames, ITEM_STATES, itemListLocalStorageInterface, itemLocalStorageInterface, ItemState } from '../../interfaces/pokemonLocalStorage';
import { AbilityInterface } from '../../interfaces/abilityInterface';
import { AbilityInfoInterface } from '../../interfaces/abilityInfoInterface';
import { AbilityLearnInterface } from '../../interfaces/abilityLearnInterface';
import { pokemonInterface } from '../../interfaces/pokemonInterface';
import { FormatNamePipe } from '../../pipe/format-name/format-name.pipe';
import { TypesInterface } from '../../interfaces/typesInterface';

@Component({
  selector: 'app-ability-dex',
  imports: [FormatNamePipe],
  templateUrl: './ability-dex.component.html',
  styleUrl: './ability-dex.component.css'
})
export class AbilityDexComponent implements OnInit, AfterViewInit {

  titleList = [
    { name: 'All', number: ALLOWED_NUMBERS[0] },
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
  storageList: AbilityInterface[] = [];
  showList: AbilityInterface[] = [];
  storagePokemonList: pokemonInterface[] = [];
  showPokemonList: pokemonInterface[] = [];
  shinyPokemon: boolean = false;

  abilityInfo: AbilityInfoInterface | null = null;
  abilityPokemonInfo: boolean = false;

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
  order: 'abc' | null = null

  abilitySection: AllowedNumbers = 0;
  abilityList: AbilityInterface[] = (abilities as any).default;
  abilityLearnList: AbilityLearnInterface[] = (learnAbilities as any).default;
  // processedIds: { [originalId: number]: number } = ids;

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

    this.initializeAbilityLocalStorage();
    this.loadStorageData();
    this.order = this.getOrderLS();
  }

  async ngAfterViewInit(): Promise<void> {
    this.getFilterLS('all');
    this.abilitySection = this.localStorageService.checkAbilitySectionLS();
    await this.updateShowList(this.abilitySection);
  }

  initializeAbilityLocalStorage(): void {

    const existingStorage = localStorage.getItem('ability-storage');

    if (existingStorage) {
      try {
        const parsedData = JSON.parse(existingStorage);

        const validatedData = {
          page: parsedData.page || 'ability',
          list: this.validateAndSortList(parsedData.list, this.abilityList)
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

    const filteredAbilities = this.abilityList.filter(ability => ability.home === true);
    const abilityArray: itemLocalStorageInterface[] = filteredAbilities.map(ability => ({
      id: ability.id,
      pokemon_id: 0,
      section: 'national',
      shiny: false,
      state: "Uncaught",
      game: "None",
      note: "",
    }));

    const abilityLocalStorage: itemListLocalStorageInterface = {
      page: "ability",
      list: abilityArray,
    };

    localStorage.setItem('ability-storage', JSON.stringify(abilityLocalStorage));
    console.log('LocalStorage inicializado:', abilityLocalStorage);
  }

  private validateAndSortList(
    storedList: itemLocalStorageInterface[],
    referenceList: AbilityInterface[]
  ): itemLocalStorageInterface[] {
    const storedMap = new Map(storedList.map(p => [p.id, p]));
    const filteredReferenceList = referenceList.filter(ability => ability.home);

    const completeList: itemLocalStorageInterface[] = filteredReferenceList.map(ability => {
      const storedData = storedMap.get(ability.id);
      
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

      console.log(`ID ${ability.id} no existía. Se ha añadido con valores predeterminados.`);
      return {
        id: ability.id,
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

  loadStorageData(): void {
    const localStorageName = 'ability-storage';
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

      this.localStorageService.setAbilitySectionLS(sectionNumber as AllowedNumbers);

      if (sectionNumber !== 0 && sectionNumber !== 1 && sectionNumber !== 2) {
        this.storageList = this.abilityList.filter(
          (ability) => ability.generation === sectionNumber && ability.home === true
        );
      } else {
        this.storageList = this.abilityList.filter(
          (ability) => ability.home === true
        );
      }

      this.cdr.detectChanges();
      this.selectedTitle(sectionNumber);
      this.showList = this.storageList;
      this.getCountCaughtAbility(section);
      this.getCountAllAbility(section);
      this.getSectionPercentageBar(this.countCaughtSection, this.countAllSection)
      if (this.filterGame !== null || this.filterNote !== null || this.filterState !== null || this.searchQuery.length >= 3) {
        this.filterShowList();
      }
      this.updateOrder();
      this.triggerContainerAnimation();
      this.cdr.detectChanges();
    } catch (err) {
      console.log("updateAbility" + err);
    }
  }

  getFilterLS(type: 'state' | 'game' | 'note' | 'pokemon' | 'all') {
    switch (type) {
      case 'state':
        const stateValue = localStorage.getItem('ability-filterState');
        this.filterState = stateValue ? stateValue as ItemState : null;
        this.selectedState(this.filterState);
        break;
      case 'game':
        const gameValue = localStorage.getItem('ability-filterGame');
        this.filterGame = gameValue ? gameValue as GameName : null;
        this.selectedGame(this.filterGame);
        break;
      case 'note':
        const noteValue = localStorage.getItem('ability-filterNote');
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
        const pokemonValue = localStorage.getItem('ability-filterPokemon');
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

  setAbilityInfo(ability: AbilityInterface): void {

    this.isDropdownOpenInfoGame = false;
    this.isDropdownOpenInfoState = false;
    const lsData: itemLocalStorageInterface | null = this.getAbilityLS(ability.id);
    if (!lsData) {
      console.warn(`No se pudo encontrar información en el localStorage para el Movimiento con ID ${ability.id}`);
      this.abilityInfo = null;
      return;
    }

    this.abilityInfo = {
      ...ability,
      pokemon_id: lsData.pokemon_id,
      shiny: lsData.shiny,
      section: lsData.section,
      state: lsData.state,
      game: lsData.game,
      note: lsData.note,
    };
  }

  stateAbilityPokemonInfo: 'learn' | 'hidden' | 'all' = 'learn'
  showPokemonAbilityInfo(string: 'toggle' | 'learn' | 'hidden' | 'all') {
    if (string === 'toggle') {

      this.abilityPokemonInfo = !this.abilityPokemonInfo

    }

    if (this.abilityPokemonInfo && string === 'all') {

      this.stateAbilityPokemonInfo = 'all'

      const element = this.renderer.selectRootElement(`#ability-info-title-learn`, true);
      this.renderer.removeClass(element, 'title-selected');

      const selectedElement2 = this.renderer.selectRootElement(`#ability-info-title-hidden`, true);
      this.renderer.removeClass(selectedElement2, 'title-selected');

      const selectedElement = this.renderer.selectRootElement(`#ability-info-title-all`, true);
      this.renderer.addClass(selectedElement, 'title-selected');

      this.storagePokemonList = this.pokemonHome.concat(
        this.pokemonRegionals,
        this.pokemonFemales,
        this.pokemonForms
      );

    } else if (this.abilityPokemonInfo && string === 'hidden') {

      this.stateAbilityPokemonInfo = 'hidden'

      const element = this.renderer.selectRootElement(`#ability-info-title-learn`, true);
      this.renderer.removeClass(element, 'title-selected');

      const selectedElement2 = this.renderer.selectRootElement(`#ability-info-title-all`, true);
      this.renderer.removeClass(selectedElement2, 'title-selected');

      const selectedElement = this.renderer.selectRootElement(`#ability-info-title-hidden`, true);
      this.renderer.addClass(selectedElement, 'title-selected');

      this.storagePokemonList = [];

      if (!this.abilityInfo) {
        throw new Error('abilityInfo is null or undefined');
      }

      const abilityId = this.abilityInfo.id;

      const ability = this.abilityLearnList.find(item => item.ability_id === abilityId);

      if (ability) {

        ability.learned_by_pokemon.forEach(pokemon => {

          const foundInHome = this.pokemonHome.find(p => p.id === pokemon.id && pokemon.is_hidden === true);
          const foundInForms = this.pokemonForms.find(p => p.id === pokemon.id && pokemon.is_hidden === true);
          const foundInRegionals = this.pokemonRegionals.find(p => p.id === pokemon.id && pokemon.is_hidden === true);
          const foundInFemales = this.pokemonFemales.find(p => p.id === pokemon.id && pokemon.is_hidden === true);

          if (foundInHome) this.storagePokemonList.push(foundInHome);
          if (foundInForms) this.storagePokemonList.push(foundInForms);
          if (foundInRegionals) this.storagePokemonList.push(foundInRegionals);
          if (foundInFemales) this.storagePokemonList.push(foundInFemales);
        });
      }

    } else if (this.abilityPokemonInfo) {
      this.stateAbilityPokemonInfo = 'learn'

      try {

        const selectedElement = this.renderer.selectRootElement(`#ability-info-title-learn`, true);
        this.renderer.addClass(selectedElement, 'title-selected');

        const element = this.renderer.selectRootElement(`#ability-info-title-all`, true);
        this.renderer.removeClass(element, 'title-selected');

        const selectedElement2 = this.renderer.selectRootElement(`#ability-info-title-hidden`, true);
        this.renderer.removeClass(selectedElement2, 'title-selected');
      } catch (e) {

      }

      this.storagePokemonList = [];

      if (!this.abilityInfo) {
        throw new Error('abilityInfo is null or undefined');
      }

      const abilityId = this.abilityInfo.id;

      const ability = this.abilityLearnList.find(item => item.ability_id === abilityId);

      if (ability) {

        ability.learned_by_pokemon.forEach(pokemon => {

          const foundInHome = this.pokemonHome.find(p => p.id === pokemon.id && pokemon.is_hidden === false);
          const foundInForms = this.pokemonForms.find(p => p.id === pokemon.id && pokemon.is_hidden === false);
          const foundInRegionals = this.pokemonRegionals.find(p => p.id === pokemon.id && pokemon.is_hidden === false);
          const foundInFemales = this.pokemonFemales.find(p => p.id === pokemon.id && pokemon.is_hidden === false);

          if (foundInHome) this.storagePokemonList.push(foundInHome);
          if (foundInForms) this.storagePokemonList.push(foundInForms);
          if (foundInRegionals) this.storagePokemonList.push(foundInRegionals);
          if (foundInFemales) this.storagePokemonList.push(foundInFemales);
        });
      }

    }

    if (!this.abilityPokemonInfo) {
      this.getSectionSelected();
    } else {
      this.showPokemonList = this.storagePokemonList;
      this.showPokemonList.sort((a, b) => a.original_id - b.original_id);
    }

    if (this.abilityPokemonInfo && this.searchPokemonQuery.length >= 3) {
      const query = this.searchPokemonQuery.trim();

      this.showPokemonList = this.storagePokemonList.filter((pokemon) => {

        const isSearchMatch = query.length < 3 ||
          new RegExp(query.split('').join('.*'), 'i').test(pokemon.name);

        return isSearchMatch;
      });
    }


  }

  getAbilityLS(id: number): itemLocalStorageInterface | null {
    const localStorageName = 'ability-storage';
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

    const abilityData = sectionData.find((item: itemLocalStorageInterface) => item.id === id);

    if (!abilityData) {
      console.warn(`Habilidad con ID ${id} no encontrado`);
      return null;
    }

    return abilityData;
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

    const filteredList = this.storageList.filter((ability) => {
      if (this.storageData) {

        const typeData = this.storageData.list;
        const matchingEntry = typeData?.find((entry) => entry.id === ability.id);

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

        if (this.currentLanguage === 'en') {
          const isSearchMatch =
            query.length < 3 || new RegExp(query.split('').join('.*'), 'i').test(ability.languaje[0].en);

          return isStateMatch && isGameMatch && isNoteMatch && isPokemonMatch && isSearchMatch;
        } else if (this.currentLanguage === 'es') {
          const isSearchMatch =
            query.length < 3 || new RegExp(query.split('').join('.*'), 'i').test(ability.languaje[1].es);

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
          localStorage.setItem('ability-filterState', this.filterState as ItemState);
        } else {
          localStorage.removeItem('ability-filterState');
        }
        break;
      case 'game':
        if (this.filterGame !== null && this.filterGame !== undefined) {
          localStorage.setItem('ability-filterGame', this.filterGame as GameName);
        } else {
          localStorage.removeItem('ability-filterGame');
        }
        break;
      case 'note':
        if (this.filterNote !== null && this.filterNote !== undefined) {
          localStorage.setItem('ability-filterNote', String(this.filterNote));
        } else {
          localStorage.removeItem('ability-filterNote');
        }
        break;
      case 'pokemon':
        if (this.filterPokemon !== null && this.filterPokemon !== undefined) {
          localStorage.setItem('ability-filterPokemon', String(this.filterPokemon));
        } else {
          localStorage.removeItem('ability-filterPokemon');
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
      if (i !== 1 && i !== 2) {
        const element = this.renderer.selectRootElement(`#ability-title-${i}`, true);
        this.renderer.removeClass(element, 'title-selected');
      }
    }
    this.titleSelected = n;
    const selectedElement = this.renderer.selectRootElement(`#ability-title-${n}`, true);
    this.renderer.addClass(selectedElement, 'title-selected');
  }

  triggerContainerAnimation() {
    const container = this.el.nativeElement.querySelector('.ability-container');
    if (container) {
      this.renderer.removeClass(container, 'animate-fade-in');
      void container.offsetWidth;
      this.renderer.addClass(container, 'animate-fade-in');
    }
  }

  changeOrder() {

    if (this.order === 'abc') {
      this.order = null;
    } else {
      this.order = 'abc';
    }
    if (this.order) {
      localStorage.setItem('ability-order', this.order)
    } else {
      localStorage.removeItem('ability-order')
    }
    this.updateOrder();
  }

  updateOrder() {
    if (this.order === 'abc') {

      if (this.currentLanguage === 'es') {
        this.showList.sort((a, b) => a.languaje[1].es.localeCompare(b.languaje[1].es));
      } else if (this.currentLanguage === 'en') {
        this.showList.sort((a, b) => a.languaje[0].en.localeCompare(b.languaje[0].en));
      }

    } else {
      this.showList.sort((a, b) => a.id - b.id);
    }
  }

  getOrderLS(): 'abc' | null {
    const orderLS = localStorage.getItem('ability-order');
    if (orderLS === 'abc') {
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
    const localStorageName = 'ability-storage'
    if (this.storageData) {
      localStorage.setItem(localStorageName, JSON.stringify(this.storageData));
    }
  }

  getAbilityStateLS(id: number): ItemState {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return 'Uncaught';
    }
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const ability = typeData.find((p) => p.id === id);
    return ability ? (ability.state as ItemState) : 'Uncaught';
  }

  setAbilityStateLS(id: number, newState: ItemState) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoState = false;
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const ability = typeData.find((p) => p.id === id);
    if (this.abilityInfo) {
      this.abilityInfo.state = newState
    }
    if (ability) {
      ability.state = newState;
      this.saveStorageData();
      this.filterShowList();
      const storedData = localStorage.getItem('ability-section');

      let section: AllowedNumbers = storedData ? Number(storedData) as AllowedNumbers : 0;

      this.getCountCaughtAbility(section);
      this.getCountAllAbility(section);
      this.getSectionPercentageBar(this.countCaughtSection, this.countAllSection)


    } else {
      console.error(`No se encontró una Habilidad con ID ${id} en la lista.`);
    }
  }

  setAbilityGameLS(id: number, newGame: GameName) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoGame = false;
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const ability = typeData.find((p) => p.id === id);
    if (this.abilityInfo) {
      this.abilityInfo.game = newGame
    }
    if (ability) {
      ability.game = newGame;
      this.saveStorageData();
      this.filterShowList();
    } else {
      console.error(`No se encontró una Habilidad con ID ${id} en la lista.`);
    }
  }

  setAbilityNoteLS(id: number, newNote: string) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    this.isDropdownOpenInfoState = false;
    this.isDropdownOpenInfoGame = false;
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const ability = typeData.find((p) => p.id === id);
    if (this.abilityInfo) {
      this.abilityInfo.note = newNote
    }
    if (ability) {
      ability.note = newNote;
      this.saveStorageData();
      this.filterShowList();
    } else {
      console.error(`No se encontró una Habilidad con ID ${id} en la lista.`);
    }
  }

  setAbilityPokemonLS(id: number, newPokemon: pokemonInterface, shiny: boolean) {
    if (!this.storageData) {
      console.error('Los datos no están cargados en memoria.');
      return;
    }
    const typeData = this.storageData.list as itemLocalStorageInterface[];
    const ability = typeData.find((p) => p.id === id);
    if (this.abilityInfo) {
      this.abilityInfo.pokemon_id = newPokemon.id;
      this.abilityInfo.section = newPokemon.section;
      this.abilityInfo.shiny = shiny;
    }
    if (ability) {
      ability.pokemon_id = newPokemon.id;
      ability.section = newPokemon.section;
      ability.shiny = shiny;
      this.saveStorageData();
      this.filterShowList();
    } else {
      console.error(`No se encontró una Habilidad con ID ${id} en la lista.`);
    }
  }

  updateAbilityInfoState(ability: AbilityInfoInterface, newState: ItemState) {
    this.setAbilityStateLS(ability.id, newState);
    ability.state = newState;
    this.abilityInfo = ability;
  }

  updateAbilityInfoGame(ability: AbilityInfoInterface, newGame: GameName) {
    this.setAbilityGameLS(ability.id, newGame);
    ability.game = newGame;
    this.abilityInfo = ability;
  }

  updateAbilityInfoPokemon(ability: AbilityInfoInterface, newPokemon: pokemonInterface) {
    if (ability.pokemon_id === newPokemon.id && ability.section === newPokemon.section && ability.shiny === this.shinyPokemon) {
      this.setAbilityPokemonLS(ability.id, this.nullPokemon, false);
      ability.pokemon_id = this.nullPokemon.id;
      ability.section = this.nullPokemon.section;
      ability.shiny = false;
      this.abilityInfo = ability
    } else {
      this.setAbilityPokemonLS(ability.id, newPokemon, this.shinyPokemon);
      ability.pokemon_id = newPokemon.id;
      ability.section = newPokemon.section;
      ability.shiny = this.shinyPokemon;
      this.abilityInfo = ability
    }
  }

  isButtonClicked = false;
  updateAbilityInfoNote(ability: AbilityInfoInterface) {
    this.isButtonClicked = true;
    const textarea = document.getElementById('textarea-info-ability') as HTMLTextAreaElement;
    const newNote = textarea?.value || '';
    this.setAbilityNoteLS(ability.id, newNote);
    ability.note = newNote;
    this.abilityInfo = ability;
    setTimeout(() => {
      this.isButtonClicked = false;
    }, 100);
  }

  getCountCaughtAbility(section: AllowedNumbers): void {
    const storage = this.storageData;

    if (!storage || !this.storageList || this.storageList.length === 0) {
      console.warn('No storage data available');
      this.countCaughtSection = 0;
      return;
    }

    let caughtCount = 0;

    if (section === 0 || section === 1 || section === 2) {

      caughtCount = storage.list.filter((ability) => ability.state === 'Caught').length;

    } else {

      caughtCount = storage.list.filter((ability) => {
        const item = this.storageList.find((item) => item.id === ability.id);
        return (
          ability.state === 'Caught' &&
          item &&
          item.generation === Number(section) &&
          item.home === true
        );
      }).length;
    }
    this.countCaughtSection = caughtCount;
  }

  getCountAllAbility(section: AllowedNumbers): void {
    const storage = this.storageData;

    if (!storage) {
      console.warn('No storage data available');
      this.countAllSection = 0;
      return;
    }

    let allCount = 0;

    if (section === 0 || section === 1 || section === 2) {

      allCount = storage.list.length;
      this.countAllSection = allCount;

    } else {
      allCount = storage.list.filter((ability) => {
        const item = this.storageList.find((item) => item.id === ability.id);
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

  setAbilityStateDC(id: number, state: ItemState) {
    let newState: ItemState
    if (state === ITEM_STATES[1]) {
      newState = ITEM_STATES[0]
    } else {
      newState = ITEM_STATES[1]
    }
    this.setAbilityStateLS(id, newState)
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
    const storedData = localStorage.getItem('ability-section');
    let section: number = storedData ? Number(storedData) : 0;
    this.cdr.detectChanges();
    this.selectedTitle(section)
  }

  getBackgroundByGameName(gameName: string): string {
    const game = gameList.find(g => g.name === gameName);
    return game ? game.background : '';
  }

  getTypeColor(type: string): string {
    const typeInfo = this.typeList.find(t => t.type === type); return typeInfo ? typeInfo.background : '#000000';
  }

  closeAbilityInfo(): void {
    this.abilityInfo = null
    this.searchPokemonQuery = ''
    this.shinyPokemon = false
    this.abilityPokemonInfo = false
    this.getSectionSelected();
  }

  onImageError(event: Event, id?: number): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/assets/home/0.png';
  }

  // getPokemonByAbilities(abilities: { id: number }[]): void {
  //   // Crea una lista de observables para cada habilidad
  //   const requests = abilities.map((ability) =>
  //     this.homeDexService.getAbilityApi(ability.id).pipe(
  //       map((response: any) => {
  //         // Mapea los Pokémon que tienen la habilidad
  //         const pokemonData = response.pokemon.map((entry: { is_hidden: boolean; slot: number; pokemon: { url: string } }) => {
  //           const urlParts = entry.pokemon.url.split('/');
  //           const pokemonId = parseInt(urlParts[urlParts.length - 2], 10);

  //           return {
  //             id: pokemonId,
  //             slot: entry.slot,
  //             is_hidden: entry.is_hidden,
  //           };
  //         });

  //         return {
  //           ability_id: ability.id,
  //           pokemon: pokemonData,
  //         };
  //       })
  //     )
  //   );

  //   // Usa forkJoin para esperar a que todas las solicitudes terminen
  //   forkJoin(requests).subscribe({
  //     next: (results) => {
  //       console.log('JSON completo:', results);
  //     },
  //     error: (err) => {
  //       console.error('Error procesando habilidades:', err);
  //     },
  //   });
  // }
  // async processPokemonAbilities(): Promise<void> {
  //   for (const ability of this.abilityLearnList) {
  //     for (const pokemon of ability.pokemon) {
  //       const pokemonId = pokemon.id;

  //       // Verifica si ya existe en el mapa
  //       if (this.processedIds[pokemonId] !== undefined) {
  //         // Usa el valor almacenado en el mapa
  //         pokemon.id = this.processedIds[pokemonId];
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
  //           pokemon.id = newId;
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
