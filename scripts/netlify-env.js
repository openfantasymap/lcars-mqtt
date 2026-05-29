/**
 * Netlify build step: write the MQTT_* environment variables (set in the Netlify
 * UI or netlify.toml [build.environment]) into the published assets/env.json,
 * which main.ts reads at runtime. This is the Netlify analogue of what
 * docker-entrypoint.sh does for the container build. Empty/unset values are left
 * blank so the app falls back to the environment.prod.ts defaults.
 *
 * Runs AFTER `ng build`, so it overwrites the empty template copied into dist/.
 */
const fs = require('fs');
const path = require('path');

const keys = ['MQTT_HOST', 'MQTT_PORT', 'MQTT_PATH', 'MQTT_PROTOCOL', 'MQTT_URL'];
const env = {};
for (const k of keys) {
  env[k] = process.env[k] || '';
}

const out = path.join(__dirname, '..', 'dist', 'lcars-mqtt', 'assets', 'env.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(env, null, 2) + '\n');

console.log('[netlify-env] wrote', out);
console.log('[netlify-env]', JSON.stringify(env));
