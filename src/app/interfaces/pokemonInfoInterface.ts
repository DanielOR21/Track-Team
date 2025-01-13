import { GameName, PokemonState } from "./pokemonLocalStorage";

export interface pokemonInfoInterface{
    id: number;
    name: string;
    original_id: number;
    type1: string;
    type2: string;
    section: 'national' | 'form' | 'regional' | 'female';
    shiny: boolean;
    state: PokemonState;
    game: GameName;
    note: string;
}