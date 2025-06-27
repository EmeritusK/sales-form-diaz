import { Routes } from '@angular/router';
import { ReporteNovedadesComponent } from './components/reporte-novedades/reporte-novedades';

export const routes: Routes = [
  { path: '', component: ReporteNovedadesComponent },
  { path: 'reporte', component: ReporteNovedadesComponent }
];
