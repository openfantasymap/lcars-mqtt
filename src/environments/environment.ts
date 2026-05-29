// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // MQTT broker connection. Overridable at runtime via /assets/env.json
  // (MQTT_HOST / MQTT_PORT / MQTT_PATH / MQTT_PROTOCOL) — see src/main.ts.
  mqtt: {
    hostname: 'mqtt.fantasymaps.org',
    port: 9001,
    path: '/ws',
    protocol: 'wss'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
