import { Routes } from '@angular/router';
import { ReporteNovedadesComponent } from './components/reporte-novedades/reporte-novedades';

export const routes: Routes = [
  { path: '', redirectTo: '/reporte', pathMatch: 'full' },
  { path: 'reporte', component: ReporteNovedadesComponent },
  { path: '**', redirectTo: '/reporte' }
];
