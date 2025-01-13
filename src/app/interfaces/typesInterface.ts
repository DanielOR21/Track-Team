export interface TypesInterface {
    type: string;
    es: string;
    background: string;
    damage_relations: {
        double_damage_from: Array<{ name: string }>;
        double_damage_to: Array<{ name: string }>;
        half_damage_from: Array<{ name: string }>;
        half_damage_to: Array<{ name: string }>;
        no_damage_from: Array<{ name: string }>;
        no_damage_to: Array<{ name: string }>;
    };
}