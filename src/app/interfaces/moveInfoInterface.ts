import { GameName, ItemState } from "./pokemonLocalStorage";

export interface MoveInfoInterface {
    id: number,
    damage_class: string,
    generation: Number,
    languaje: [
        {
            en: string
        },
        {
            es: string
        }
    ],
    type: string,
    home: boolean,
    pokemon_id:number,
    section: 'national' | 'form' | 'regional' | 'female';
    shiny: boolean;
    state: ItemState;
    game: GameName;
    note: string;
}