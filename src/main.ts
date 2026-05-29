import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { MQTT_SERVICE_OPTIONS } from './app/mqtt.config';

// Optionally override the MQTT connection at runtime from /assets/env.json
// (docker-entrypoint.sh / Netlify build write container env vars there), so the
// same build can target a different broker without rebuilding. Mutating
// MQTT_SERVICE_OPTIONS before bootstrap is safe: MqttModule.forRoot holds this
// exact object and MqttService is only constructed once the app boots below.
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
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch(err => console.error(err));
