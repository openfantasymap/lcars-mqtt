import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MqttModule } from 'ngx-mqtt';

import { routes } from './app.routes';
import { MQTT_SERVICE_OPTIONS } from './mqtt.config';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 21 defaults to zoneless; this app updates the view from rxjs/MQTT
    // subscriptions (not signals), so it needs zone-based change detection.
    // zone.js is included via angular.json `polyfills`.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(MqttModule.forRoot(MQTT_SERVICE_OPTIONS))
  ]
};
