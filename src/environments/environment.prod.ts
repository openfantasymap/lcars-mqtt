export const environment = {
  production: true,
  // MQTT broker connection. Overridable at runtime via /assets/env.json
  // (MQTT_HOST / MQTT_PORT / MQTT_PATH / MQTT_PROTOCOL) — see src/main.ts.
  mqtt: {
    hostname: 'mqtt.fantasymaps.org',
    port: 9001,
    path: '/ws',
    protocol: 'wss'
  }
};
