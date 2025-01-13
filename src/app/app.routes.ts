import { Routes } from '@angular/router';
import { HomeDexComponent } from './components/home-dex/home-dex.component';
import { MoveDexComponent } from './components/move-dex/move-dex.component';
import { AbilityDexComponent } from './components/ability-dex/ability-dex.component';
import { TypeChartComponent } from './components/type-chart/type-chart.component';
import { ImportExportComponent } from './components/import-export/import-export.component';

export const routes: Routes = [
    {path: 'HomeDex', component: HomeDexComponent},
    {path: 'MoveDex', component: MoveDexComponent},
    {path: 'AbilityDex', component: AbilityDexComponent},
    {path: 'TypeChart', component: TypeChartComponent},
    {path: 'ImportExport', component: ImportExportComponent},
    {path: '', component: HomeDexComponent}
];
