import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StationComponent } from './station/station.component';
import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';
import { InterfaceComponent } from './interface/interface.component';
import { ButtonComponent } from './base/button/button.component';
import { NavComponent } from './nav/nav.component';
import { WarpcoreComponent } from './base/warpcore/warpcore.component';

export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  hostname: 'mqtt.fantasymaps.org',
  port: 9001,
  path: '/ws',
  protocol: "wss"
};


@NgModule({
  declarations: [
    AppComponent,
    StationComponent,
    InterfaceComponent,
    ButtonComponent,
    NavComponent,
    WarpcoreComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
    
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas:[
    NO_ERRORS_SCHEMA
  ]
})
export class AppModule { }
