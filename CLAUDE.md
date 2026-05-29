# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Platform context: this app lives under the OFM monorepo (`/srv/ofm`). See `/srv/ofm/CLAUDE.md` for the wider platform. `lcars-mqtt` is the real-time consumer of the platform's MQTT pub/sub (HiveMQ), rendered as a Star Trek **LCARS** console. Sibling dirs `../lcars-gen` and `../lcars-lib` are related but separate projects.

## What this is

An Angular 21 standalone single-page app that renders an **LCARS-style control panel whose entire layout is described by JSON received over MQTT**. There is almost no hard-coded screen — components are instantiated dynamically from a configuration tree. Two roles share one app:

- **Station** (`lcars/:room/:station`) — a player console for one bridge role. The role is the URL segment; the built-in roster is `comms`, `conn`, `navigation`, `bridge`, `engineering`, `transporters` (anything else gets the `default` layout). Each loads its own layout from `/assets/stations.json` (see below), renders the LCARS chrome + a config-driven widget tree, and publishes user actions back to MQTT.
- **Master** (`lcars/:room/master`) — the GM control surface: edits global settings (title/footer/theme), pushes ship conditions (alerts), and watches incoming data streams.

A "room" namespaces an entire session's MQTT topic space.

## Commands

Angular 21 requires **Node ≥ 20.19**.

```bash
npm install
npm start                     # ng serve, dev server on :4200
npm run build                 # prod build → dist/lcars-mqtt/browser/
npm run watch                 # rebuild on change, development config
```

⚠️ **This sandbox is glibc 2.27 — it can only run Node ≤ 16, so the Angular 21 toolchain won't run natively here.** Run it via Docker (the verified path):

```bash
docker run --rm -v "$PWD":/app -w /app node:20 sh -c "npm install --no-audit --no-fund && npx ng build"
```

On a normal Node 20+ machine use the `npm`/`ng` commands directly. There is **no lint or test setup** — the default `.spec.ts` scaffolds were dropped in the standalone migration.

### Docker / deploy

```bash
./build.sh        # docker buildx build → push ofdistantworlds/lcars-mqtt:latest
```

- `Dockerfile`: multi-stage — Node 20 build (`--output-path=./dist/out`; the application builder lands deployable files in `dist/out/browser`, which nginx serves) → `nginx:alpine`.
- `docker-entrypoint.sh`: at container start, dumps **all env vars to `assets/env.json`** via `jq`, then `nginx -g "daemon off;"`. `main.ts` reads this file at startup, so setting `MQTT_HOST`/`MQTT_PORT`/`MQTT_PATH`/`MQTT_PROTOCOL` (or `MQTT_URL`) as container env vars re-points the broker **without a rebuild**.
- `nginx.conf`: SPA fallback (`try_files … /index.html`).

### Netlify (static)

`netlify.toml` drives it: build command `npm run build && node scripts/netlify-env.js` → publish `dist/lcars-mqtt/browser`, with a `/* → /index.html` 200 redirect for the SPA routes and `NODE_VERSION = "20"` (pinned via `.nvmrc` too). Netlify env vars are **build-time only**, so `scripts/netlify-env.js` (the Netlify analogue of `docker-entrypoint.sh`) bakes `MQTT_HOST/PORT/PATH/PROTOCOL/URL` from `process.env` into the published `assets/env.json` after the build; `main.ts` reads it at runtime. **To point a Netlify deploy at a different broker, set those vars in the Netlify UI (Site settings → Environment variables) or `netlify.toml [build.environment]` and redeploy** — unset vars fall back to the `environment.prod.ts` defaults. Connect the repo in the Netlify UI, or `netlify deploy --prod` with the CLI.

## Architecture — the parts that matter

### `ConnectorService` is the whole backend (`src/app/connector.service.ts`)
A single root-provided service wraps `ngx-mqtt`. **All cross-component state and I/O flow through it.** Topic conventions, all prefixed by `{room}/`:

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `{room}/settings` | sub + pub | Global settings JSON (title, footer, `style` colors, `sources[]`). Seeded from `/assets/settings.json`, then live-overridden by MQTT. |
| `{room}/global` | sub + pub | **Retained** ship-wide alert condition (`shipCondition`, `{status}`). On receipt `ConnectorService` emits `conditionChange`; `AppComponent` shows a full-screen alert overlay. Driven by the SHIP-tab buttons *and* by open-issue severity (see Issues). |
| `{room}/connections` | pub | Connect handshake (`{op:"connect", station?}`), QoS 1. |
| `{room}/io/{source}` | sub + pub | Per-source data streams. `sendMessage(topic, msg)` / `publishIo(emit, value)` publish here; command widgets publish their value here on interaction. |
| `{room}/{station}/form` | sub | Legacy per-station layout push (GM). |
| `{room}/screens` | sub + pub (Master only) | **Retained** screen registry (`{id: layout}`) authored in the Master's SCREENS tab. A station resolves its layout as `screens[id]` > `{station}/form` > `/assets/stations.json` seed. |
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

**To add a new widget type:** create a standalone component under `src/app/base/`, add it to `ContainerComponent`'s `imports`, then add a `*ngSwitchCase` in `base/container/container.component.html`. The switch wires up `row`, `column`, `nav`, `button`, `toggle`, `issues`, `stats`, and `panel` (a section header / placeholder, `{type:'panel', title, note?}`). The old empty role stubs (`warpcore`/`transporterbuffer`/`stellar`/`personnel`/sliders/`chrome`) were **deleted** in the Angular 21 migration; the real role components live in the sibling **`lcars-ngx`** library, which a later phase wires in.

**Per-station layouts:** `ConnectorService.setupStation()` resolves a station's layout from three sources, highest priority first: the GM **screen registry** `screens[id]`, the legacy `{room}/{station}/form` push, then the `/assets/stations.json` seed (keyed by station id, `default` fallback). Each layout is a station `form`: `{title, footer, structure: {sidebar[], content{tab: <container>}}, sources[]}`.

**Runtime screen editor:** the Master's **SCREENS** tab (`ScreenEditorComponent` + `ScreenService`) lets the GM author/edit screens as JSON at runtime (mix-and-matching the component palette) and publishes them to the retained `{room}/screens` registry — no rebuild. A screen's id is the station URL: a player opens `/lcars/:room/<screenId>`, so custom screens are just new ids. The editor seeds itself from `stations.json` so the built-in roles are there to clone. (`src/assets/default.json` is the older single SCI layout, now unused.) Global (non-layout) config lives in `src/assets/settings.json`.

### Command widgets and `BaseEmitter`
Interactive widgets (`button`, `toggle`, `nav`) extend `BaseEmitter` (`src/app/component-interface.ts`, an abstract `@Directive()` base), which carries `@Input() emit` and a single publish path `emitValue(value)` — it publishes to `{room}/io/{emit}` **and** feeds `IssueService.reportLocalState` (so auto-resolved issues can see console state). `BaseEmitter` uses `inject()` for its `ConnectorService`/`IssueService`, so subclasses don't thread deps through `super()`. Value semantics: toggle → boolean `status`, button → its `value` input (default `true`), nav → direction string. `nav`'s template is an SVG (`nav.component.svg`).

### Issues — GM challenges (`src/app/issue.service.ts`, `src/app/models/issue.ts`)
The GM (Master view) authors **Issues** — problems posed to one station or the whole crew (`target: '*'`). An issue is `manual` (GM clicks Resolve) or `auto` (declares an `AutoCondition.match` of `io-topic → expected value`; **all** must deep-equal). The **board is a single retained snapshot on `{room}/issues`, written only by Master** (the GM is the authority) — this keeps it race-free, but auto-resolution requires a Master to be connected.

- **Flow:** GM authors via `IssuesPanelComponent` (Issues tab in Master) → `IssueService.createIssue/createFromPreset` mutates the board and republishes (retained). Stations render their slice via the `lcars-issues` widget (`base/issues/`, a `*ngSwitchCase` in the container; included in `default.json`). When a station's `localState` matches an open auto-issue's condition, it publishes a `ResolutionReport` to `{room}/issues/resolution`; **Master commits** it back to the board.
- **Presets:** `src/assets/issues.json` is the starter library; the GM can also push a live override to `{room}/issues/presets`.
- **Severity drives the ship-wide alert.** The highest-severity OPEN issue sets `{room}/global` (Master-only, deduped in `IssueService.syncAlert`): `yellow→alert_yellow`, `red→alert_red`, `black→alert_black` (rank red>black>yellow; `info` raises nothing). Every screen (`AppComponent`) shows a pulsing full-screen alert overlay. Resolving/cancelling the issue stands the alert down. The manual SHIP-tab buttons write the same topic; an issue change recomputes from issues and will override a manual setting.

### Fleet / ship stats (`src/app/ship.service.ts`, `src/app/models/ship.ts`)
The GM edits a **fleet** of ships in the **OVERVIEW** tab (`ShipOverviewComponent`); each `Ship` has an `alert` level and a free-form list of `Stat`s (`label`, `value`, optional `max` → renders as a gauge). Same single-writer model as issues: the fleet is a **retained snapshot on `{room}/ships`, written only by Master**, mirrored to every station.

- **Players act on stats.** The `lcars-stats` widget (`base/stats/`, `*ngSwitchCase 'stats'`, config `{type:'stats', ship?, editable?, step?}`) renders a ship's stats; when `editable`, numeric stats get −/+ controls. A player adjustment publishes a `StatCommand` to `{room}/ship/cmd`; **Master applies it** (clamping `delta` to `[0,max]`) and republishes the board. So both GM and players can change stats, but the board stays single-writer (Master commits).
- **Echo guard:** once the Master starts authoring it ignores incoming `{room}/ships` snapshots (its own retained echoes) so inline edits aren't clobbered mid-keystroke — see `ShipService.authored`. Seed comes from `/assets/ships.json`, published only if no retained board already exists for the room.

### Theming
LCARS colors are CSS custom properties `--main-color`, `--secondary-color`, `--tertiary-color`, set via `@HostBinding` on `AppComponent` and driven by `settings.style`. `MasterComponent` ships era presets (TOS/TNG/DIS/VOY/PIC). The entire LCARS CSS framework (elbows, bars, brackets, the `lcars-u-{w}-{h}` sizing grid) lives in `src/styles.scss`.

## Gotchas

- **Standalone, no NgModule.** Bootstrap is `bootstrapApplication(AppComponent, appConfig)` in `main.ts`; app-wide providers (router, HttpClient, `MqttModule.forRoot`) live in `src/app/app.config.ts`; routes in `src/app/app.routes.ts`. Each component lists its template deps in its own `imports` (the recursive `ContainerComponent` imports itself + every widget). `strictTemplates` is **off** in tsconfig (the dynamic configs are `any`-typed), so a mistyped selector/binding can still fail quietly — check by hand.
- **MQTT broker config lives in `environment.*`** (`mqtt: {hostname, port, path, protocol}`), fed into `MQTT_SERVICE_OPTIONS` in `src/app/mqtt.config.ts` and provided via `importProvidersFrom(MqttModule.forRoot(...))` in `app.config.ts`. At runtime `main.ts` overrides it from `/assets/env.json` (keys `MQTT_HOST/PORT/PATH/PROTOCOL/URL`) **before bootstrap** — empty/missing values fall back to the environment defaults. Default broker: `wss://mqtt.fantasymaps.org:9001/ws`.
- In `ConnectorService.connect()` the JSON-parse/`__topic`-tagging pipeline is **commented out**, so `MasterComponent` receives raw `IMqttMessage` objects (not parsed payloads). `setupConnectors()` does parse. Mind which path a stream came through.
- `StationComponent.mode = "local"` but it still subscribes to MQTT regardless — local asset JSON is just the initial seed before live topics arrive.
- All *layout* config is untyped (`any`) with no schema validation — malformed `form` payloads silently render nothing. (The **issue** layer is typed in `models/issue.ts`.)
- **Issues need a Master connected.** Auto-resolution reports are committed to the board only by the Master view; with no GM tab open, an `auto` issue's `ResolutionReport` is published but never written back to `{room}/issues`.
