# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Platform context: this app lives under the OFM monorepo (`/srv/ofm`). See `/srv/ofm/CLAUDE.md` for the wider platform. `lcars-mqtt` is the real-time consumer of the platform's MQTT pub/sub (HiveMQ), rendered as a Star Trek **LCARS** console. Sibling dirs `../lcars-gen` and `../lcars-lib` are related but separate projects.

## What this is

An Angular 14 single-page app that renders an **LCARS-style control panel whose entire layout is described by JSON received over MQTT**. There is almost no hard-coded screen — components are instantiated dynamically from a configuration tree. Two roles share one app:

- **Station** (`lcars/:room/:station`) — a display/console for one game station (e.g. `sci`, `nav`). Renders the LCARS chrome + a config-driven widget tree, and publishes user actions back to MQTT.
- **Master** (`lcars/:room/master`) — the GM control surface: edits global settings (title/footer/theme), pushes ship conditions (alerts), and watches incoming data streams.

A "room" namespaces an entire session's MQTT topic space.

## Commands

```bash
npm install
ng serve                      # dev server on :4200 (defaultConfiguration: development)
ng build                      # prod build → dist/lcars-mqtt/ (Docker overrides output path)
npm run watch                 # rebuild on change, development config
ng test                       # Karma + Jasmine (Chrome launcher)
ng test --include='**/connector.service.spec.ts'   # single spec
```

There is **no lint config** in this project (the platform CLAUDE.md mentions `flake8`, which is Python-only and does not apply here). Specs are mostly default CLI scaffolding — there is no meaningful test coverage yet.

### Docker / deploy

```bash
./build.sh        # docker buildx build → push ofdistantworlds/lcars-mqtt:latest
```

- `Dockerfile`: multi-stage — Node 16 build (`--output-path=./dist/out`) → `nginx:alpine`.
- `docker-entrypoint.sh`: at container start, dumps **all env vars to `assets/env.json`** via `jq` (runtime config injection pattern), then `nginx -g "daemon off;"`. Note: the app does not currently read `env.json` — the broker is hard-coded (see below).
- `nginx.conf`: SPA fallback (`try_files … /index.html`).

### Netlify (static)

`netlify.toml` drives it: `npm run build` → publish `dist/lcars-mqtt`, with a `/* → /index.html` 200 redirect for the SPA routes and `NODE_VERSION = "16"` (pinned via `.nvmrc` too). Pure static — no runtime env injection (the MQTT broker is hard-coded in `app.module.ts`, so nothing is needed at request time). Connect the repo in the Netlify UI, or `netlify deploy --prod` with the CLI; settings are read from `netlify.toml`, no dashboard config required.

## Architecture — the parts that matter

### `ConnectorService` is the whole backend (`src/app/connector.service.ts`)
A single root-provided service wraps `ngx-mqtt`. **All cross-component state and I/O flow through it.** Topic conventions, all prefixed by `{room}/`:

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `{room}/settings` | sub + pub | Global settings JSON (title, footer, `style` colors, `sources[]`). Seeded from `/assets/settings.json`, then live-overridden by MQTT. |
| `{room}/global` | pub | Ship condition / alerts (`shipCondition`). |
| `{room}/connections` | pub | Connect handshake (`{op:"connect", station?}`), QoS 1. |
| `{room}/io/{source}` | sub + pub | Per-source data streams. `sendMessage(topic, msg)` / `publishIo(emit, value)` publish here; command widgets publish their value here on interaction. |
| `{room}/{station}/form` | sub | Station-specific layout config JSON. Seeded from `/assets/default.json`. |
| `{room}/issues` | sub + pub (Master only) | **Retained** issue board (`Issue[]`). See the Issues section below. |
| `{room}/issues/resolution` | sub (Master) / pub (station) | Station-reported auto-resolutions (`ResolutionReport`). |
| `{room}/issues/presets` | sub | Optional retained preset-library override; otherwise from `/assets/issues.json`. |
| `{room}/ships` | sub + pub (Master only) | **Retained** fleet board (`Ship[]`), ship stats. See the Fleet section below. |
| `{room}/ship/cmd` | sub (Master) / pub (station) | Player stat mutations (`StatCommand`, `set`/`delta`) that Master commits to the board. |

Generic helpers `publishJson(sub, obj, opts?)` / `publishRaw(...)` / `observeJson<T>(sub)` prefix the room and (de)serialize JSON; pass `{retain:true}` for snapshots. Changes are broadcast to components via `EventEmitter`s: `settingsChange`, `stationChange`, `connectorsChange` (and `IssueService.issuesChange`/`presetsChange`). Components subscribe in `ngOnInit`.

### Config-driven dynamic rendering (the key extensibility point)
The UI is a recursive tree built from JSON, not from templates:

1. `InterfaceComponent` (`lcars-interface`) draws the LCARS frame — header, footer, sidebar buttons — and selects a `content` block by `active` tab key.
2. `ContainerComponent` (`lcars-container`, `base/container/`) is **recursive**. Its template `*ngSwitch`es on `configuration.type` to emit the right widget and recurses into `configuration.content[]` for `row`/`column`.

**To add a new widget type:** create the component under `src/app/base/`, declare it in `app.module.ts`, then add a `*ngSwitchCase` in `base/container/container.component.html`. ⚠️ Currently the switch only wires up `row`, `column`, `nav`, `button`, `toggle`, `issues` — the other components in `base/` (`warpcore`, `stellar`, `transporterbuffer`, `personnel`, `vslider`, `hslider`, `chrome`) exist but are **not yet reachable from the dynamic renderer**.

Config shapes live in `src/assets/default.json` (a station `form`) and `src/assets/settings.json` (global settings). Study these to understand the expected JSON contract before changing the renderer.

### Command widgets and `BaseEmitter`
Interactive widgets (`button`, `toggle`, `nav`) extend `BaseEmitter` (`src/app/component-interface.ts`), which carries `@Input() emit` and a single publish path `emitValue(value)` — it publishes to `{room}/io/{emit}` **and** feeds `IssueService.reportLocalState` (so auto-resolved issues can see console state). `BaseEmitter` uses `inject()` for its `ConnectorService`/`IssueService`, so subclasses don't thread deps through `super()`. Value semantics: toggle → boolean `status`, button → its `value` input (default `true`), nav → direction string. Some templates are SVGs (`nav.component.svg`, `transporterbuffer.component.svg`).

### Issues — GM challenges (`src/app/issue.service.ts`, `src/app/models/issue.ts`)
The GM (Master view) authors **Issues** — problems posed to one station or the whole crew (`target: '*'`). An issue is `manual` (GM clicks Resolve) or `auto` (declares an `AutoCondition.match` of `io-topic → expected value`; **all** must deep-equal). The **board is a single retained snapshot on `{room}/issues`, written only by Master** (the GM is the authority) — this keeps it race-free, but auto-resolution requires a Master to be connected.

- **Flow:** GM authors via `IssuesPanelComponent` (Issues tab in Master) → `IssueService.createIssue/createFromPreset` mutates the board and republishes (retained). Stations render their slice via the `lcars-issues` widget (`base/issues/`, a `*ngSwitchCase` in the container; included in `default.json`). When a station's `localState` matches an open auto-issue's condition, it publishes a `ResolutionReport` to `{room}/issues/resolution`; **Master commits** it back to the board.
- **Presets:** `src/assets/issues.json` is the starter library; the GM can also push a live override to `{room}/issues/presets`.
- Severity (`info|yellow|red|black`) currently only colors the UI; it is the intended hook for driving `{room}/global` ship alerts later.

### Fleet / ship stats (`src/app/ship.service.ts`, `src/app/models/ship.ts`)
The GM edits a **fleet** of ships in the **OVERVIEW** tab (`ShipOverviewComponent`); each `Ship` has an `alert` level and a free-form list of `Stat`s (`label`, `value`, optional `max` → renders as a gauge). Same single-writer model as issues: the fleet is a **retained snapshot on `{room}/ships`, written only by Master**, mirrored to every station.

- **Players act on stats.** The `lcars-stats` widget (`base/stats/`, `*ngSwitchCase 'stats'`, config `{type:'stats', ship?, editable?, step?}`) renders a ship's stats; when `editable`, numeric stats get −/+ controls. A player adjustment publishes a `StatCommand` to `{room}/ship/cmd`; **Master applies it** (clamping `delta` to `[0,max]`) and republishes the board. So both GM and players can change stats, but the board stays single-writer (Master commits).
- **Echo guard:** once the Master starts authoring it ignores incoming `{room}/ships` snapshots (its own retained echoes) so inline edits aren't clobbered mid-keystroke — see `ShipService.authored`. Seed comes from `/assets/ships.json`, published only if no retained board already exists for the room.

### Theming
LCARS colors are CSS custom properties `--main-color`, `--secondary-color`, `--tertiary-color`, set via `@HostBinding` on `AppComponent` and driven by `settings.style`. `MasterComponent` ships era presets (TOS/TNG/DIS/VOY/PIC). The entire LCARS CSS framework (elbows, bars, brackets, the `lcars-u-{w}-{h}` sizing grid) lives in `src/styles.scss`.

## Gotchas

- **`NO_ERRORS_SCHEMA` is enabled** in `AppModule`. Unknown elements/attributes (e.g. a mistyped `lcars-*` selector or `@Input` name) **fail silently** instead of erroring — double-check selector/binding names by hand.
- **MQTT broker is hard-coded** in `MQTT_SERVICE_OPTIONS` (`app.module.ts`): `wss://mqtt.fantasymaps.org:9001/ws`. Change it there, not via env.
- In `ConnectorService.connect()` the JSON-parse/`__topic`-tagging pipeline is **commented out**, so `MasterComponent` receives raw `IMqttMessage` objects (not parsed payloads). `setupConnectors()` does parse. Mind which path a stream came through.
- `StationComponent.mode = "local"` but it still subscribes to MQTT regardless — local asset JSON is just the initial seed before live topics arrive.
- All *layout* config is untyped (`any`) with no schema validation — malformed `form` payloads silently render nothing. (The **issue** layer is typed in `models/issue.ts`.)
- **Issues need a Master connected.** Auto-resolution reports are committed to the board only by the Master view; with no GM tab open, an `auto` issue's `ResolutionReport` is published but never written back to `{room}/issues`.
