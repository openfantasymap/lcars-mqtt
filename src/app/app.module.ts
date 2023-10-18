import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StationComponent } from './station/station.component';
import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';
import { InterfaceComponent } from './interface/interface.component';
import { ButtonComponent } from './base/button/button.component';
import { NavComponent } from './base/nav/nav.component';
import { WarpcoreComponent } from './base/warpcore/warpcore.component';
import { ChromeComponent } from './base/chrome/chrome.component';
import { ConnectorService } from './connector.service';
import { ContainerComponent } from './base/container/container.component';
import { RowComponent } from './base/row/row.component';
import { ColumnComponent } from './base/column/column.component';
import { TransporterbufferComponent } from './base/transporterbuffer/transporterbuffer.component';
import { ToggleComponent } from './base/toggle/toggle.component';
import { StellarComponent } from './base/stellar/stellar.component';
import { VsliderComponent } from './base/vslider/vslider.component';
import { HsliderComponent } from './base/hslider/hslider.component';
import { PersonnelComponent } from './base/personnel/personnel.component';
import { MasterComponent } from './master/master.component';
import { FormsModule } from '@angular/forms';
import { ValuerendererComponent } from './valuerenderer/valuerenderer.component';

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
    WarpcoreComponent,
    ChromeComponent,
    ContainerComponent,
    RowComponent,
    ColumnComponent,
    TransporterbufferComponent,
    ToggleComponent,
    StellarComponent,
    VsliderComponent,
    HsliderComponent,
    PersonnelComponent,
    MasterComponent,
    ValuerendererComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
    
  ],
  providers: [
  ],
  bootstrap: [AppComponent],
  schemas:[
    NO_ERRORS_SCHEMA
  ]
})
export class AppModule { }
