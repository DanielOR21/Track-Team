export const ALLOWED_STATES = ['Uncaught', 'Caught', 'Wanted', 'Stored', 'Evolve', 'Change'] as const;
export type PokemonState = typeof ALLOWED_STATES[number];

export const ITEM_STATES = ['Uncaught', 'Caught', 'Wanted'] as const;
export type ItemState = typeof ITEM_STATES[number];

export const ALLOWED_VALUES = ['none', 1, 2, 3, 4, 5, 6, 7, 8, 9 ,'national','form', 'regional', 'female'] as const;
export type AllowedValue = typeof ALLOWED_VALUES[number];

export const ALLOWED_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type AllowedNumbers = typeof ALLOWED_NUMBERS[number];


export interface pokemonLocalStorageInterface {
    id: number;
    state: PokemonState;
    game: GameName;
    note: string;
}

export interface HomeLocalStorageInterface {
    page: string;
    type: {
        national: pokemonLocalStorageInterface[];
        form: pokemonLocalStorageInterface[];
        regional: pokemonLocalStorageInterface[];
        female: pokemonLocalStorageInterface[];
    };
}

export interface itemListLocalStorageInterface {
    page: string;
    list: itemLocalStorageInterface[];
}

export interface itemLocalStorageInterface {
    id: number,
    pokemon_id:number,
    shiny: boolean,
    section: 'national' | 'form' | 'female' | 'regional'
    state: ItemState,
    game: GameName,
    note: string,

}

export const gameList: Array<{ name: GameName; group: string; background: string;}> = [
    { name: 'None', group: '0', background: ''},
    { name: 'Home', group: '0', background: 'radial-gradient(circle, rgb(89, 218, 172) 25%, rgba(70, 194, 124, 1) 100%);'},
    { name: 'Bank', group: '0', background: 'radial-gradient(circle, rgb(223, 192, 105) 25%, rgb(214, 125, 8) 100%);'},
  
    { name: 'Red', group: '1', background: 'radial-gradient(circle, rgb(255, 0, 0) 25%, rgb(172, 164, 154) 100%);'},
    { name: 'Blue', group: '1', background: 'radial-gradient(circle, rgb(0, 0, 255) 25%, rgb(172, 164, 154) 100%);'},
    { name: 'Yellow', group: '1', background: 'radial-gradient(circle, rgb(255, 255, 0) 25%, rgb(172, 164, 154) 100%);'},
  
    { name: 'Gold', group: '2', background: 'radial-gradient(circle, rgb(202, 164, 80) 25%, rgb(172, 164, 154) 100%);'},
    { name: 'Silver', group: '2', background: 'radial-gradient(circle, rgb(118, 118, 122) 25%, rgb(172, 164, 154) 100%);'},
    { name: 'Crystal', group: '2', background: 'radial-gradient(circle, rgb(134, 235, 235) 25%, rgb(172, 164, 154) 100%);'},
  
    { name: 'Sapphire', group: '3', background: 'radial-gradient(circle, rgb(40, 51, 204) 25%, rgb(24, 22, 117) 100%);'},
    { name: 'Ruby', group: '3', background: 'radial-gradient(circle, rgb(207, 42, 20) 25%, rgb(117, 28, 22) 100%);'},
    { name: 'Emerald', group: '3', background: 'radial-gradient(circle, rgb(64, 175, 0) 25%, rgb(38, 117, 22) 100%);'},

    { name: 'FireRed', group: '4', background: 'radial-gradient(circle, rgb(255, 60, 0) 25%, rgb(255, 115, 0) 100%);'},
    { name: 'LeafGreen', group: '4', background: 'radial-gradient(circle, rgb(10, 211, 10) 25%, rgb(62, 247, 62) 100%);'},

    { name: 'Colosseum', group: '5', background: 'radial-gradient(circle, rgb(230, 208, 113) 25%, rgb(67, 0, 94) 100%);'},
    { name: 'XD', group: '5', background: 'radial-gradient(circle, rgb(43, 19, 110) 25%, rgb(67, 0, 94) 100%);'},
  
    { name: 'Diamond', group: '6', background: 'radial-gradient(circle, rgb(41, 72, 212) 25%, rgb(45, 45, 49) 100%);'},
    { name: 'Pearl', group: '6', background: 'radial-gradient(circle, rgb(218, 137, 213) 25%, rgb(45, 45, 49) 100%);'},
    { name: 'Platinum', group: '6', background: 'radial-gradient(circle, rgb(231, 184, 28) 25%, rgb(45, 45, 49) 100%);'},

    { name: 'HeartGold', group: '7', background: 'radial-gradient(circle, rgb(202, 164, 80) 25%, rgb(253, 200, 95) 100%);'},
    { name: 'SoulSilver', group: '7', background: 'radial-gradient(circle, rgb(185, 185, 194) 25%, rgb(216, 218, 226) 100%);'},
  
    { name: 'Black', group: '8', background: 'radial-gradient(circle, rgb(0, 0, 0) 25%, rgb(34, 34, 34) 100%);'},
    { name: 'White', group: '8', background: 'radial-gradient(circle, rgb(255, 255, 255) 25%, rgb(216, 218, 226) 100%);'},

    { name: 'Black2', group: '9', background: 'radial-gradient(circle, rgb(128, 128, 128) 25%, rgb(0, 0, 0) 100%);'},
    { name: 'White2', group: '9', background: 'radial-gradient(circle, rgb(128, 128, 128) 25%, rgb(255, 255, 255) 100%);'},
  
    { name: 'X', group: '10', background: 'radial-gradient(circle, rgb(8, 50, 128) 25%, rgb(38, 38, 41) 100%);'},
    { name: 'Y', group: '10', background: 'radial-gradient(circle, rgb(80, 21, 21) 25%, rgb(41, 38, 38) 100%);'},

    { name: 'AlphaSphr', group: '11', background: 'radial-gradient(circle, rgb(24, 22, 117) 25%, rgb(168, 157, 0) 100%);'},
    { name: 'OmegaRuby', group: '11', background: 'radial-gradient(circle, rgb(117, 28, 22) 25%, rgb(168, 157, 0) 100%);'},
  
    { name: 'Sun', group: '12', background: 'radial-gradient(circle, rgb(221, 127, 4) 25%, rgb(238, 223, 9) 100%);'},
    { name: 'Moon', group: '12', background: 'radial-gradient(circle, rgb(112, 25, 194) 25%, rgb(19, 30, 133) 100%);'},

    { name: 'UltraSun', group: '13', background: 'radial-gradient(circle, rgb(221, 127, 4) 25%, rgb(46, 43, 1) 100%);'},
    { name: 'UltraMoon', group: '13', background: 'radial-gradient(circle, rgb(112, 25, 194) 25%, rgb(3, 7, 39) 100%);'},

    { name: 'LGPikachu', group: '14', background: 'radial-gradient(circle, rgb(255, 255, 73) 25%, rgb(228, 228, 0) 100%);'},
    { name: 'LGEevee', group: '14', background: 'radial-gradient(circle, rgb(170, 125, 0) 25%, rgb(133, 97, 0) 100%);'},
  
    { name: 'Sword', group: '15', background: 'radial-gradient(circle, rgb(0, 225, 255) 25%, rgb(232, 252, 255) 100%);'},
    { name: 'Shield', group: '15', background: 'radial-gradient(circle, rgb(255, 0, 85) 25%, rgb(255, 232, 232) 100%);'},

    { name: 'LgndArceus', group: '16', background: 'radial-gradient(circle, rgb(255, 255, 255) 25%, rgb(238, 199, 25) 100%);'},
    { name: 'BrllntDmnd', group: '16', background: 'radial-gradient(circle, rgb(41, 72, 212) 25%, rgb(229, 229, 240) 100%);'},
    { name: 'ShngPearl', group: '16', background: 'radial-gradient(circle, rgb(218, 137, 213) 25%, rgb(232, 214, 233) 100%);'},
  
    { name: 'Scarlet', group: '17', background: 'radial-gradient(circle, rgb(221, 0, 0) 25%, rgb(121, 0, 0) 100%);'},
    { name: 'Violet', group: '17', background: 'radial-gradient(circle, rgb(133, 0, 221) 25%, rgb(77, 0, 121) 100%);'},
  
    { name: 'Go', group: '18', background: 'radial-gradient(circle, rgb(61, 63, 223) 25%, rgb(0, 13, 196) 100%);'},
    { name: 'Stadium', group: '18', background: 'linear-gradient(to bottom right, rgb(65, 147, 253) 30%, rgb(241, 77, 0) 70%);'},
    { name: 'Stadium2', group: '18', background: 'linear-gradient(to bottom right, rgb(192, 143, 7) 30%, rgb(140, 140, 146) 70%);'},
    { name: 'Box', group: '18', background: 'linear-gradient(to bottom, rgb(235, 0, 0) 30%, rgb(0, 24, 238) 70%);'},
    { name: 'Ranch', group: '18', background: 'radial-gradient(circle, rgb(0, 114, 0) 25%, rgb(110, 85, 0) 100%);'},
    { name: 'BattleRev', group: '18', background: 'linear-gradient(to bottom right, rgb(51, 49, 197) 30%, rgb(241, 127, 236) 70%);'},
    { name: 'DreamWorld', group: '18', background: 'radial-gradient(circle, rgb(186, 0, 196) 25%, rgb(135, 2, 161) 100%);'},
    { name: 'Other', group: '18', background: 'radial-gradient(circle, rgb(107, 107, 112) 25%, rgb(139, 139, 139) 100%);'},
  ];

  export const gameNames = [
    'None', 'Home', 'Bank',
    'Red', 'Blue', 'Yellow',
    'Gold', 'Silver', 'Crystal',
    'Ruby', 'Sapphire', 'Emerald',
    'FireRed', 'LeafGreen',
    'Colosseum', 'XD',
    'Diamond', 'Pearl', 'Platinum',
    'HeartGold', 'SoulSilver',
    'Black', 'White',
    'Black2', 'White2',
    'X', 'Y',
    'AlphaSphr', 'OmegaRuby',
    'Sun', 'Moon',
    'UltraSun', 'UltraMoon',
    'LGPikachu', 'LGEevee',
    'Sword', 'Shield',
    'LgndArceus', 'BrllntDmnd', 'ShngPearl',
    'Scarlet', 'Violet',
    'Go', 'Stadium', 'Stadium2', 'Box', 'Ranch', 'BattleRev', 'DreamWorld', 'Other'
  ] as const;
  
  export type GameName = (typeof gameNames)[number];