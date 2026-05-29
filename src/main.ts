import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule, MQTT_SERVICE_OPTIONS } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Optionally override the MQTT connection at runtime from /assets/env.json
// (docker-entrypoint.sh writes container env vars there), so the same build can
// target a different broker without rebuilding. Mutating MQTT_SERVICE_OPTIONS
// before bootstrap is safe: MqttModule.forRoot holds this exact object and
// MqttService is only constructed once the app boots below. Falls back to the
// environment defaults when the file is absent (e.g. on Netlify).
fetch('/assets/env.json')
  .then(res => (res.ok ? res.json() : {}))
  .catch(() => ({}))
  .then((env: any) => {
    if (env && env.MQTT_HOST) { MQTT_SERVICE_OPTIONS.hostname = env.MQTT_HOST; }
    if (env && env.MQTT_PORT) { MQTT_SERVICE_OPTIONS.port = +env.MQTT_PORT; }
    if (env && env.MQTT_PATH) { MQTT_SERVICE_OPTIONS.path = env.MQTT_PATH; }
    if (env && env.MQTT_PROTOCOL) { MQTT_SERVICE_OPTIONS.protocol = env.MQTT_PROTOCOL; }
    if (env && env.MQTT_URL) { MQTT_SERVICE_OPTIONS.url = env.MQTT_URL; }
  })
  .then(() => platformBrowserDynamic().bootstrapModule(AppModule))
  .catch(err => console.error(err));
