import { Routes } from '@angular/router';
import { MasterComponent } from './master/master.component';
import { StationComponent } from './station/station.component';

export const routes: Routes = [
  { path: 'lcars/:room/master', component: MasterComponent },
  { path: 'lcars/:room/:station', component: StationComponent }
];
