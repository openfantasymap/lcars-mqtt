import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StationComponent } from './station/station.component';
import { MasterComponent } from './master/master.component';

const routes: Routes = [
  {path: "lcars/:room/master", component: MasterComponent},
  {path: "lcars/:room/:station", component: StationComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
