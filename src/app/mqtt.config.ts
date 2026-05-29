import { IMqttServiceOptions } from 'ngx-mqtt';
import { environment } from '../environments/environment';

/**
 * Broker connection, sourced from the environment. main.ts may mutate these
 * values at runtime (from /assets/env.json) before the app bootstraps; the
 * MqttModule.forRoot provider in app.config holds this exact object.
 */
export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  hostname: environment.mqtt.hostname,
  port: environment.mqtt.port,
  path: environment.mqtt.path,
  protocol: environment.mqtt.protocol as 'ws' | 'wss'
};
