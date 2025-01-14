import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';

import * as types from '../../../assets/templates/types-template.json';
import { TypesInterface } from '../../interfaces/typesInterface';
import { DamageRelationsInterface } from '../../interfaces/damageRelationsInterface';
import { LocalStorageService } from '../../services/local-storage.service';
import { FormatNamePipe } from "../../pipe/format-name/format-name.pipe";
import { KeyValuePipe } from '@angular/common';

interface TotalRelations {
  weaknesses: Record<string, number>;
  resistances: Record<string, number>;
}

@Component({
  selector: 'app-type-chart',
  imports: [FormatNamePipe, KeyValuePipe],
  templateUrl: './type-chart.component.html',
  styleUrl: './type-chart.component.css'
})
export class TypeChartComponent implements OnInit {

  currentLanguage: 'en' | 'es' = 'en';
  typeList: TypesInterface[] = (types as any).default;
  selectedType: TypesInterface | null = null;

  rows = [1, 2, 3, 4, 5, 6];
  combinedRelations: { [key: string]: any } = {};
  showRelations: { [key: string]: any } = {};
  showTotalRelations: TotalRelations | null = null;

  noResisted: { [key: string]: boolean } = {};
  noWeak: { [key: string]: boolean } = {};

  currentTarget: string | null = null;
  selectedTypes: { [key: string]: string } = {};

  dropdownVisible = false;
  dropdownStyles = {
    top: '0px',
    left: '0px'
  };

  constructor(private localStorageService: LocalStorageService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.localStorageService.language$.subscribe((language) => {
      this.currentLanguage = language;
    });

    this.rows.forEach(row => {
      this.selectedTypes[`type1-${row}`] = 'none';
      this.selectedTypes[`type2-${row}`] = 'none';
    });

    this.typeList.forEach(type => {
      this.noResisted[type.type] = true;
      this.noWeak[type.type] = true;
    });
  }

  openDropdown(event: MouseEvent, type: string, row: number): void {
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const boundingBox = target.getBoundingClientRect();

    this.dropdownStyles = {
      top: `${boundingBox.bottom + window.scrollY}px`,
      left: `${boundingBox.left + window.scrollX}px`
    };

    this.dropdownVisible = true;
    this.currentTarget = `${type}-${row}`;
    this.cdr.detectChanges();
  }

  updateTypeSelection(type: string, target: string | null): void {
    if (target) {

      this.selectedTypes[target] = type;

      const [slot, row] = target.split('-');
      this.updateTypeRelationRow(parseInt(row), this.getSelectedTypesForRow(row));
    }
    this.dropdownVisible = false;
  }

  getSelectedTypesForRow(row: string): string[] {
    const type1 = Object.keys(this.selectedTypes).find(key => key === `type1-${row}`);
    const type2 = Object.keys(this.selectedTypes).find(key => key === `type2-${row}`);
    return [
      type1 ? this.selectedTypes[type1].replace('/assets/types/', '').replace('.png', '') : 'none',
      type2 ? this.selectedTypes[type2].replace('/assets/types/', '').replace('.png', '') : 'none'
    ].filter(type => type && type !== 'none');
  }

  updateTypeRelationRow(row: number, types: string[]): void {
    const relations: DamageRelationsInterface = {
      double_damage_from: [],
      double_damage_to: [],
      half_damage_from: [],
      half_damage_to: [],
      no_damage_from: [],
      no_damage_to: []
    };

    types.forEach(type => {
      const typeData = this.typeList.find(t => t.type === type);
      if (typeData) {
        relations.double_damage_from.push(...typeData.damage_relations.double_damage_from.map(d => d.name));
        relations.double_damage_to.push(...typeData.damage_relations.double_damage_to.map(d => d.name));
        relations.half_damage_from.push(...typeData.damage_relations.half_damage_from.map(d => d.name));
        relations.half_damage_to.push(...typeData.damage_relations.half_damage_to.map(d => d.name));
        relations.no_damage_from.push(...typeData.damage_relations.no_damage_from.map(d => d.name));
        relations.no_damage_to.push(...typeData.damage_relations.no_damage_to.map(d => d.name));
      }
    });

    // Asegura que cada categoría está separada correctamente
    this.combinedRelations[row] = {
      double_damage_from: relations.double_damage_from,
      double_damage_to: relations.double_damage_to,
      half_damage_from: relations.half_damage_from,
      half_damage_to: relations.half_damage_to,
      no_damage_from: relations.no_damage_from,
      no_damage_to: relations.no_damage_to
    };

    this.calculateShowRelations(row);

  }

  calculateShowRelations(row: number): void {
    const relations = this.combinedRelations[row];

    if (!relations) return;

    const findDuplicates = (arr: string[]): string[] => {
      const duplicates: string[] = [];
      const seen: Set<string> = new Set();

      arr.forEach((type) => {
        if (seen.has(type) && !duplicates.includes(type)) {
          duplicates.push(type);
        } else {
          seen.add(type);
        }
      });

      return duplicates;
    };

    const super_weaknesses = findDuplicates(relations.double_damage_from);
    const super_resistances = findDuplicates(relations.half_damage_from);

    const weaknesses = relations.double_damage_from.filter((type: string) =>
      !relations.half_damage_from.includes(type) &&
      !relations.no_damage_from.includes(type) &&
      !super_weaknesses.includes(type)
    );

    const resistances = relations.half_damage_from.filter((type: string) =>
      !relations.double_damage_from.includes(type) &&
      !relations.no_damage_from.includes(type) &&
      !super_resistances.includes(type)
    );

    const immunities = [...relations.no_damage_from];

    this.showRelations[row] = {
      weaknesses: weaknesses,
      resistances: resistances,
      immunities: immunities,
      super_weaknesses: super_weaknesses,
      super_resistances: super_resistances
    };

    this.updateGlobalNoWeakAndNoResisted();
    this.calculateTotalRelations();
  }

  calculateTotalRelations(): void {
    const totalRelations = {
      weaknesses: {} as Record<string, number>,
      resistances: {} as Record<string, number>
    };

    const updateTypeCount = (typeObj: Record<string, number>, type: string, increment: number) => {
      if (typeObj[type] !== undefined) {
        typeObj[type] += increment;
        if (typeObj[type] <= 0) {
          delete typeObj[type];
        }
      } else if (increment > 0) {
        typeObj[type] = increment;
      }
    };

    Object.values(this.showRelations).forEach((relation: any) => {
      if (!relation) return;
      [...relation.weaknesses, ...relation.super_weaknesses].forEach((type: string) => {
        updateTypeCount(totalRelations.weaknesses, type, 1);
      });
      [...relation.resistances, ...relation.super_resistances, ...relation.immunities].forEach((type: string) => {
        updateTypeCount(totalRelations.resistances, type, 1);
      });
    });

    Object.keys(totalRelations.weaknesses).forEach((type) => {
      if (totalRelations.resistances[type]) {
        const weaknessCount = totalRelations.weaknesses[type];
        const resistanceCount = totalRelations.resistances[type];

        // Resta resistencias de debilidades
        const difference = weaknessCount - resistanceCount;

        if (difference > 0) {
          totalRelations.weaknesses[type] = difference; // Quedan debilidades sobrantes
          delete totalRelations.resistances[type]; // Todas las resistencias desaparecen
        } else if (difference < 0) {
          totalRelations.resistances[type] = -difference; // Quedan resistencias sobrantes
          delete totalRelations.weaknesses[type]; // Todas las debilidades desaparecen
        } else {
          // Si son iguales, elimina ambas
          delete totalRelations.weaknesses[type];
          delete totalRelations.resistances[type];
        }
      }
    });

    const sortByCount = (obj: Record<string, number>): Record<string, number> => {
      return Object.fromEntries(
        Object.entries(obj).sort(([, a], [, b]) => b - a) // Orden descendente por valor
      );
    };

    this.showTotalRelations = {
      weaknesses: sortByCount(totalRelations.weaknesses),
      resistances: sortByCount(totalRelations.resistances)
    };

  }

  updateGlobalNoWeakAndNoResisted(): void {
    // Inicializar sets globales para todas las categorías
    const globalWeaknesses = new Set<string>();
    const globalResistances = new Set<string>();
    const globalImmunities = new Set<string>();
    const globalSuperWeaknesses = new Set<string>();
    const globalSuperResistances = new Set<string>();
  
    // Combinar relaciones de todos los rows
    Object.values(this.showRelations).forEach(relation => {
      if (relation && relation.weaknesses) {
        relation.weaknesses.forEach((type: string) => globalWeaknesses.add(type));
      }
      if (relation && relation.resistances) {
        relation.resistances.forEach((type: string) => globalResistances.add(type));
      }
      if (relation && relation.immunities) {
        relation.immunities.forEach((type: string) => globalImmunities.add(type));
      }
      if (relation && relation.super_weaknesses) {
        relation.super_weaknesses.forEach((type: string) => globalSuperWeaknesses.add(type));
      }
      if (relation && relation.super_resistances) {
        relation.super_resistances.forEach((type: string) => globalSuperResistances.add(type));
      }
    });
  
    // Actualizar noWeak
    Object.keys(this.noWeak).forEach((type) => {
      this.noWeak[type] = globalWeaknesses.has(type) || globalSuperWeaknesses.has(type) ? false : true;
    });
  
    // Actualizar noResisted
    Object.keys(this.noResisted).forEach((type) => {
      this.noResisted[type] =
        globalResistances.has(type) || globalSuperResistances.has(type) || globalImmunities.has(type) ? false : true;
    });
  }

  closeDropdown(): void {
    this.dropdownVisible = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.type-dropdown-content');
    const clickedInsideDropdown = dropdown?.contains(target);

    if (!clickedInsideDropdown) {
      this.closeDropdown();
    }
  }

  resetTypes() {
    this.rows.forEach(row => {
      this.selectedTypes[`type1-${row}`] = 'none';
      this.selectedTypes[`type2-${row}`] = 'none';
      this.combinedRelations[row] = {};
      this.showRelations[row] = {
        weaknesses: [],
        resistances: [],
        immunities: [],
        super_weaknesses: [],
        super_resistances: []
      };
    });

    this.showTotalRelations = null;

    this.typeList.forEach(type => {
      this.noWeak[type.type] = true;
      this.noResisted[type.type] = true;
    });

    this.updateGlobalNoWeakAndNoResisted();
  }


  selectType(type: TypesInterface): void {
    if (this.selectedType === type) {
      this.selectedType = null;
      return;
    }
    this.selectedType = type;
  }

  getTranslatedTitle(typeName: string): string {
    if (typeName === 'none') {
      return this.currentLanguage === 'es' ? 'nada' : 'none';
    }
    const typeEntry = this.typeList.find(type => type.type.toLowerCase() === typeName.toLowerCase());
    return this.currentLanguage === 'es' && typeEntry ? typeEntry.es : typeName;
  }

  ngOnDestroy(): void {
    this.closeDropdown();
  }


}
