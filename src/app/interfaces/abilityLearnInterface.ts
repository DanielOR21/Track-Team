export interface AbilityPokemonInterface {
    id: number;
    slot: number;
    is_hidden: boolean;
  }
  
  // Interfaz para una habilidad
  export interface AbilityLearnInterface {
    ability_id: number;
    learned_by_pokemon: AbilityPokemonInterface[];
  }