import { GameName, ItemState } from "./pokemonLocalStorage";

export interface AbilityInfoInterface {
    id: number,
    generation: Number,
    languaje: [
        {
            en: string
        },
        {
            es: string
        }
    ],
    home: boolean,
    pokemon_id: number,
    section: 'national' | 'form' | 'regional' | 'female';
    shiny: boolean;
    state: ItemState;
    game: GameName;
    note: string;
}