export interface pokemonInterface{
    id: number;
    name: string;
    original_id: number;
    type1: string;
    type2: string;
    section: 'national' | 'form' | 'regional' | 'female';
}